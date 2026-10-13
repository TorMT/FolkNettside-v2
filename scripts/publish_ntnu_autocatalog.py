#!/usr/bin/env python3
"""Local opt-in V2-only NTNU catalog publisher. Dry-run unless --apply.

Read a reviewed public-folder allowlist and scan *metadata only*, never
read course file contents. Write only `webedit/v2-staging/data/ntnu-autocatalog.json`.
Retain old V1/semestre/index.json files. Backups are outside the webroot.
No scheduler is installed or started by this script.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
from pathlib import Path

from preview_ntnu_autocatalog import build_catalog, public_json

CATALOG_NAME = "ntnu-autocatalog.json"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def resources(catalog: dict) -> int:
    return sum(len(course["resources"]) for semester in catalog["semesters"]
               for course in semester["courses"])


def _no_symlink_parents(root: Path, path: Path) -> None:
    for part in (path, *path.parents):
        if part == root.parent:
            break
        if part.is_symlink():
            raise ValueError("Refusing symlink in NTNU catalog target")


def check_paths(webroot: Path, backup_root: Path) -> tuple[Path, Path]:
    root = webroot.resolve(strict=True)
    if not root.is_dir() or not (root / "index.html").is_file() or not (
            root / "semestre").is_dir():
        raise ValueError("Unverified NTNU webedit root")
    folder = root / "v2-staging" / "data"
    if not folder.is_dir() or not (root / "v2-staging" / "index.html").is_file():
        raise ValueError("A reviewed V2 staging installation must already exist")
    _no_symlink_parents(root, folder)
    target = folder / CATALOG_NAME
    if target.is_symlink() or (target.exists() and not target.is_file()):
        raise ValueError("Unsafe generated catalog destination")
    backup = backup_root.absolute()
    if (backup == root or backup.is_relative_to(root) or
        root.is_relative_to(backup)):
        raise ValueError("Backups must be outside public NTNU webroot")
    if (backup.is_symlink() or
        any(part.is_symlink() for part in backup.parents)):
        raise ValueError("Backup path contains symlink")
    return target, backup


def _validate_previous(content: bytes) -> dict:
    try:
        catalog = json.loads(content)
    except (ValueError, UnicodeError):
        raise ValueError("Current V2 catalog is malformed; refusing replacement")
    if (not isinstance(catalog, dict) or catalog.get("schemaVersion") != 2 or
        catalog.get("source") != "ntnu-auto-preview" or
        not isinstance(catalog.get("semesters"), list)):
        raise ValueError("Existing V2 catalog has unknown schema")
    return catalog


def prepare(webroot: Path, allowlist: dict, backup_root: Path,
            *, allow_removals: bool = False) -> dict:
    target, backup = check_paths(webroot, backup_root)
    proposed = build_catalog(webroot, allowlist)
    blob = (json.dumps(proposed, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    existing = target.read_bytes() if target.exists() else None
    if existing is not None and len(existing) > 4_000_000:
        raise ValueError("Unexpected oversized existing catalog")
    previous = _validate_previous(existing) if existing is not None else None
    old_count = resources(previous) if previous is not None else 0
    new_count = resources(proposed)
    # Refuse high-impact removal due to an unmounted/missing semester directory.
    # A legitimate cleanup requires an explicit manual override.
    if (previous is not None and old_count >= 8 and
        new_count < old_count * 0.75 and not allow_removals):
        raise ValueError("Over 25 percent of resources disappeared; review before publishing")
    if previous is not None and old_count and not new_count:
        raise ValueError("Refusing to empty a non-empty published course catalog")
    return {
        "target": target, "backup": backup,
        "old": existing, "new": blob,
        "changed": existing != blob,
        "oldResources": old_count, "newResources": new_count,
        "newCourses": sum(len(s["courses"]) for s in proposed["semesters"]),
        "digest": sha(blob)
    }


def publish(webroot: Path, allowlist: dict, backup_root: Path,
            *, apply: bool = False, allow_removals: bool = False) -> dict:
    result = prepare(webroot, allowlist, backup_root, allow_removals=allow_removals)
    report = {
        "mode": "V2-only public metadata", "applied": False,
        "changed": result["changed"],
        "oldResources": result["oldResources"],
        "newResources": result["newResources"],
        "newCourses": result["newCourses"],
        "sha256": result["digest"],
        "target": str(result["target"]), "deletedFiles": 0
    }
    if not apply or not result["changed"]:
        return report
    backup = result["backup"]
    if not backup.is_dir():
        raise ValueError("Backup folder must exist outside webedit before --apply")
    target = result["target"]
    # Another process could have changed the file after the dry-run.
    snapshot = target.read_bytes() if target.exists() else None
    if snapshot != result["old"]:
        raise ValueError("Concurrent index edit; refusing overwrite")
    if result["old"] is not None:
        filename = "ntnu-autocatalog-" + sha(snapshot)[:20] + ".json"
        old_backup = backup / filename
        if old_backup.exists():
            if old_backup.read_bytes() != snapshot:
                raise ValueError("Backup name collision")
        else:
            fd, temp_name = tempfile.mkstemp(prefix=".ntnu-backup-", dir=backup)
            try:
                with os.fdopen(fd, "wb") as out:
                    out.write(snapshot)
                    out.flush()
                    os.fsync(out.fileno())
                os.replace(temp_name, old_backup)
            finally:
                if os.path.exists(temp_name):
                    os.unlink(temp_name)
    fd, temp_name = tempfile.mkstemp(prefix=".folk-catalog-", dir=target.parent)
    try:
        with os.fdopen(fd, "wb") as out:
            out.write(result["new"])
            out.flush()
            os.fsync(out.fileno())
        # Refuse to replace a late symlink or concurrent manual edits.
        if target.is_symlink() or (
                (target.read_bytes() if target.exists() else None) != result["old"]):
            raise ValueError("Target changed during auto-index update")
        os.replace(temp_name, target)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)
    report["applied"] = True
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--webroot", type=Path, required=True)
    parser.add_argument("--allowlist", type=Path, required=True)
    parser.add_argument("--backup-root", type=Path, required=True)
    parser.add_argument("--apply", action="store_true", help="Publish V2 JSON only")
    parser.add_argument("--allow-removals", action="store_true",
                        help="Manually approve >25 percent resource loss")
    args = parser.parse_args()
    data = public_json(args.allowlist)
    report = publish(args.webroot, data, args.backup_root,
                     apply=args.apply, allow_removals=args.allow_removals)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if not args.apply:
        print("DRY RUN: nothing changed on webedit.")


if __name__ == "__main__":
    main()
