#!/usr/bin/env python3
"""Reviewable code-only NTNU staging releases with external backups and rollback.

Never uses git on webedit, never removes course files, never changes the V1 root.
Dry run is the default. Apply requires a new --backup-dir outside both trees.
Rollback checks hashes and refuses to overwrite later edits.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from publish_ntnu_staging import APP_FOLDER, plan

RECORD = "release.json"
VERSION = 1


def sha256(path: Path) -> str:
    dig = hashlib.sha256()
    with path.open("rb") as f:
        for buf in iter(lambda: f.read(1024 * 1024), b""):
            dig.update(buf)
    return dig.hexdigest()


def _external(folder: Path, stage: Path, webroot: Path) -> Path:
    path = folder.absolute()
    stage = stage.resolve(strict=True)
    root = webroot.resolve(strict=True)
    if (path == root or path.is_relative_to(root) or
        path == stage or path.is_relative_to(stage) or
        root.is_relative_to(path) or stage.is_relative_to(path)):
        raise ValueError("Backup must be in a dedicated directory outside NTNU webroot and build")
    for parent in (path, *path.parents):
        if parent.is_symlink():
            raise ValueError("Symlink in backup path")
    return path


def _atomic_copy(source: Path, dest: Path) -> None:
    if dest.is_symlink() or (dest.exists() and not dest.is_file()):
        raise ValueError("Unsafe destination: " + str(dest))
    dest.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".folk-v2-", dir=dest.parent)
    try:
        with os.fdopen(fd, "wb") as out, source.open("rb") as inp:
            shutil.copyfileobj(inp, out, 1024 * 1024)
        os.replace(tmp, dest)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def _atomic_json(path: Path, record: dict) -> None:
    fd, tmp = tempfile.mkstemp(prefix=".folk-release-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(record, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def prepare(stage: Path, webroot: Path, backup_dir: Path) -> dict:
    operation = plan(stage, webroot)
    target = Path(operation["target"])
    backup = _external(backup_dir, stage, webroot)
    if backup.exists():
        raise ValueError("Use a new, empty backup directory for every release")
    records = []
    for source, relative in operation["changes"]:
        dest = target / relative
        # The file list came from the vetted code-only build; never accept
        # absolute paths or paths escaping the staging subtree.
        if (relative.is_absolute() or ".." in relative.parts or
            dest.is_symlink() or not dest.resolve().is_relative_to(target.resolve())):
            raise ValueError("Unsafe destination path in deployment")
        existed = dest.is_file()
        records.append({
            "path": relative.as_posix(),
            "existed": existed,
            "before": sha256(dest) if existed else None,
            "after": sha256(source),
        })
    records.sort(key=lambda x: (x["path"] == "index.html", x["path"]))
    return {
        "schema": VERSION, "status": "prepared",
        "createdUtc": datetime.now(timezone.utc).isoformat(),
        "build": operation["build"], "target": str(target.resolve()),
        "backup": str(backup), "totalFiles": operation["totalFiles"],
        "files": records,
    }


def _safe_record_path(record: dict, target: Path) -> Path:
    raw = record.get("path")
    if (not isinstance(raw, str) or not raw or "\\" in raw or
        raw.startswith("/") or any(p in {"", ".", ".."} for p in raw.split("/"))):
        raise ValueError("Invalid rollback record path")
    path = target.joinpath(*raw.split("/"))
    if not path.resolve().is_relative_to(target.resolve()):
        raise ValueError("Rollback path escapes V2 staging")
    if path.is_symlink():
        raise ValueError("Refusing to touch symlink in release target")
    return path


def rollback(release_dir: Path, *, apply: bool = False) -> dict:
    release = release_dir.resolve(strict=True)
    state_path = release / RECORD
    record = json.loads(state_path.read_text(encoding="utf-8"))
    target = Path(record["target"]).resolve(strict=True)
    if (record.get("schema") != VERSION or target.name != APP_FOLDER or
        target.is_symlink() or not (target.parent / "semestre").is_dir() or
        not (target.parent / "index.html").is_file()):
        raise ValueError("Invalid V2 rollback target or release manifest")
    if record.get("status") not in {"applied", "partial", "prepared"}:
        raise ValueError("Release is not eligible for rollback")
    rows = record.get("files", [])
    if not isinstance(rows, list):
        raise ValueError("Malformed rollback file list")
    operations = []
    for entry in rows:
        path = _safe_record_path(entry, target)
        backup_file = release / "originals" / entry["path"]
        current = sha256(path) if path.is_file() and not path.is_symlink() else None
        valid = {entry.get("after")}
        if record["status"] in {"partial", "prepared"}:
            # Failed deployments can have a mixture of original and new
            # assets. A rollback must permit either known SHA, never unknown
            # manual edits or a symlink.
            valid.add(entry.get("before"))
        if (path.is_symlink() or (path.exists() and not path.is_file()) or
            current not in valid):
            raise ValueError("Rollback conflict: deployed file changed: " + entry["path"])
        if entry.get("existed"):
            if (not backup_file.is_file() or backup_file.is_symlink() or
                sha256(backup_file) != entry.get("before")):
                raise ValueError("Missing or modified rollback backup: " + entry["path"])
        operations.append((path, backup_file, bool(entry.get("existed")),
                           current, entry.get("before")))
    if apply:
        # Reverse apply order, restoring index.html first to stop new traffic
        # using code about to be rolled back.
        for dest, backup_file, existed, current, before in reversed(operations):
            if current == before and record["status"] in {"partial", "prepared"}:
                continue  # Never overwrite an already intact original.
            if existed:
                _atomic_copy(backup_file, dest)
            elif dest.exists():
                dest.unlink()  # Only a hash-verified file created in this release.
        record["status"] = "rolled_back"
        _atomic_json(state_path, record)
    return {
        "releaseDir": str(release), "target": str(target),
        "files": len(operations), "applied": apply
    }


def deploy(stage: Path, webroot: Path, backup_dir: Path, *, apply: bool = False) -> dict:
    record = prepare(stage, webroot, backup_dir)
    if not apply:
        return {k: v for k, v in record.items() if k != "files"} | {
            "changedFiles": len(record["files"]), "applied": False
        }
    release = Path(record["backup"])
    release.mkdir(parents=True, exist_ok=False)
    originals = release / "originals"
    originals.mkdir()
    target = Path(record["target"])
    try:
        for entry in record["files"]:
            if entry["existed"]:
                src = target / entry["path"]
                dst = originals / entry["path"]
                dst.parent.mkdir(parents=True, exist_ok=True)
                _atomic_copy(src, dst)
        _atomic_json(release / RECORD, record)
        record["status"] = "partial"
        _atomic_json(release / RECORD, record)
        # Assets first, index.html last, to reduce mixed-build windows.
        for entry in record["files"]:
            source = stage.resolve(strict=True) / entry["path"]
            dest = _safe_record_path(entry, target)
            if entry["existed"] and sha256(dest) != entry["before"]:
                raise ValueError("Destination changed after preflight: " + entry["path"])
            _atomic_copy(source, dest)
            if sha256(dest) != entry["after"]:
                raise ValueError("Deployment verification failed: " + entry["path"])
        record["status"] = "applied"
        _atomic_json(release / RECORD, record)
    except Exception:
        # Roll back only if all changed on-disk paths still match either the
        # prepared original or the release bytes. No blind overwrite.
        try:
            recover = []
            for entry in record["files"]:
                path = _safe_record_path(entry, target)
                if not path.exists():
                    continue
                value = sha256(path)
                if value not in {entry["before"], entry["after"]}:
                    raise ValueError("Manual intervention required: target changed")
                if value == entry["after"]:
                    recover.append(entry)
            for entry in reversed(recover):
                path = target / entry["path"]
                if entry["existed"]:
                    _atomic_copy(originals / entry["path"], path)
                else:
                    path.unlink()
            record["status"] = "rolled_back"
            _atomic_json(release / RECORD, record)
        except Exception:
            # Preserve the release evidence for an operator-assisted recovery.
            pass
        raise
    return {
        "releaseDir": str(release), "build": record["build"],
        "target": str(target), "changedFiles": len(record["files"]),
        "totalFiles": record["totalFiles"], "applied": True, "deletedFiles": 0
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", type=Path, default=Path(".deploy-ntnu-staging"))
    parser.add_argument("--webroot", type=Path)
    parser.add_argument("--backup-dir", type=Path)
    parser.add_argument("--rollback", type=Path,
                        help="Previously recorded release directory, outside the NTNU webroot")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if args.rollback:
        if args.webroot or args.backup_dir:
            parser.error("--rollback cannot be combined with a new deployment")
        output = rollback(args.rollback, apply=args.apply)
    else:
        if not args.webroot or not args.backup_dir:
            parser.error("--webroot and --backup-dir are required")
        output = deploy(args.stage, args.webroot, args.backup_dir, apply=args.apply)
    print(json.dumps(output, indent=2, ensure_ascii=False))
    if not args.apply:
        print("DRY RUN ONLY. Review output and choose --apply explicitly.")


if __name__ == "__main__":
    main()
