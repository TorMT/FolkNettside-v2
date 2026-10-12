#!/usr/bin/env python3
"""Safely copy ONLY a validated V2 build into <verified NTNU webroot>/v2-staging.

Never copy the repository itself, its .git history, or the semester archive.
Dry-run is default; --apply is required to write. Never delete existing files.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import tempfile
from pathlib import Path

APP_FOLDER = "v2-staging"
REQUIRED = ("index.html", "build.txt", "src/app.js", "data/content-manifest.json")
SKIP = {".git", "semestre", "site-content", "private", "protected",
        "beskyttet", "secrets", ".env"}
MAX_FILES = 15000


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def staged_files(stage: Path) -> list[tuple[Path, Path]]:
    stage = stage.resolve(strict=True)
    if not stage.is_dir() or any(not (stage / p).is_file() for p in REQUIRED):
        raise ValueError("Expected a completed, marked V2 staging build")
    result = []
    for path in stage.rglob("*"):
        relative = path.relative_to(stage)
        if path.is_symlink() or any(part.casefold() in SKIP for part in relative.parts):
            raise ValueError("Unexpected linked or protected staging entry: " + str(relative))
        if not path.is_file():
            continue
        if path.suffix.casefold() == ".php":
            raise ValueError("PHP scripts need a separate reviewed deployment")
        if path.name.casefold().startswith((".env", ".htaccess", ".htpasswd")):
            raise ValueError("NTNU security configuration must not be copied")
        result.append((path, relative))
    if len(result) > MAX_FILES:
        raise ValueError("V2 deployment contains too many files")
    return result


def plan(stage: Path, webroot: Path) -> dict:
    stage = stage.resolve(strict=True)
    webroot = webroot.resolve(strict=True)
    if not webroot.is_dir() or not (webroot / "index.html").is_file() or not (
            webroot / "semestre").is_dir():
        raise ValueError("Not the verified NTNU web root (V1 index and semestre required)")
    if stage == webroot or stage.is_relative_to(webroot) or webroot.is_relative_to(stage):
        raise ValueError("Staging source and webroot must be separate")
    target = webroot / APP_FOLDER
    if target.is_symlink():
        raise ValueError("Target staging folder cannot be a symlink")
    if target.exists() and not target.is_dir():
        raise ValueError("Target staging path is not a directory")
    files = staged_files(stage)
    changes = []
    for source, rel in files:
        target_file = target / rel
        parent = target_file.parent
        while parent != webroot:
            if parent.is_symlink():
                raise ValueError("Symlink in existing NTNU staging path")
            if parent == target:
                break
            parent = parent.parent
        if target_file.is_symlink():
            raise ValueError("Refusing to overwrite a symlink: " + str(rel))
        if target_file.exists() and not target_file.is_file():
            raise ValueError("Destination collides with directory: " + str(rel))
        if not target_file.exists() or digest(source) != digest(target_file):
            changes.append((source, rel))
    return {
        "source": str(stage), "target": str(target),
        "build": (stage / "build.txt").read_text(encoding="utf-8").strip(),
        "totalFiles": len(files), "changedFiles": len(changes),
        "changes": changes
    }


def publish(stage: Path, webroot: Path, *, apply: bool = False) -> dict:
    operation = plan(stage, webroot)
    if apply:
        target = Path(operation["target"])
        target.mkdir(parents=True, exist_ok=True)
        for source, relative in operation["changes"]:
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.is_symlink():
                raise ValueError("NTNU target became a symlink during deployment")
            fd, temp_name = tempfile.mkstemp(prefix=".folk-v2-", dir=destination.parent)
            try:
                with os.fdopen(fd, "wb") as writer, source.open("rb") as reader:
                    shutil.copyfileobj(reader, writer, length=1024 * 1024)
                os.replace(temp_name, destination)
            finally:
                if os.path.exists(temp_name):
                    os.remove(temp_name)
    return {key: value for key, value in operation.items() if key != "changes"} | {
        "applied": apply, "deletedFiles": 0
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", type=Path, default=Path(".deploy-ntnu-staging"))
    parser.add_argument("--webroot", type=Path, required=True)
    parser.add_argument("--apply", action="store_true",
                        help="Actually copy changed V2 files (default: dry run)")
    args = parser.parse_args()
    report = publish(args.stage, args.webroot, apply=args.apply)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if not args.apply:
        print("Dry run only. Review the destination before rerunning with --apply.")


if __name__ == "__main__":
    main()
