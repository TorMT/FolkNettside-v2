#!/usr/bin/env python3
"""Read-only SHA-256 verification of reviewed public files copied into NTNU staging.

This is an exact byte-parity check for approved assets, NOT a complete
classification or functional migration audit. It never follows symlinks.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from build_ntnu_staging import approved_files

ROOT = Path(__file__).resolve().parents[1]


def sha256_file(path: Path) -> str:
    with path.open("rb") as stream:
        value = hashlib.sha256()
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(chunk)
        return value.hexdigest()


def verify_public_assets(
    manifest_path: Path,
    approved_root: Path,
    build_root: Path,
) -> dict:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    staged_manifest = build_root / "data" / "content-manifest.json"
    if not staged_manifest.is_file() or staged_manifest.is_symlink():
        raise ValueError("Staging package lacks a regular content manifest")
    staged = json.loads(staged_manifest.read_text(encoding="utf-8"))
    if staged != manifest:
        raise ValueError("Staging manifest differs from reviewed manifest")

    approved = approved_files(manifest, approved_root)
    stage = build_root.resolve(strict=True)
    if not stage.is_dir() or build_root.is_symlink():
        raise ValueError("Staging root is not a regular directory")
    verified, errors = [], []
    for original, relative in approved:
        copy = stage / relative
        if not copy.is_file() or copy.is_symlink() or not copy.resolve().is_relative_to(stage):
            errors.append({"file": relative.as_posix(), "status": "missing_or_unsafe"})
            continue
        current = stage
        unsafe = False
        for part in relative.parts:
            current = current / part
            if current.is_symlink():
                unsafe = True
                break
        if unsafe:
            errors.append({"file": relative.as_posix(), "status": "symlink_path"})
            continue

        original_size = original.stat().st_size
        copied_size = copy.stat().st_size
        if original_size != copied_size:
            errors.append({"file": relative.as_posix(), "status": "size_mismatch",
                           "sourceBytes": original_size, "stagedBytes": copied_size})
            continue
        source_digest = sha256_file(original)
        staged_digest = sha256_file(copy)
        if source_digest != staged_digest:
            errors.append({"file": relative.as_posix(), "status": "sha256_mismatch",
                           "sourceSHA256": source_digest, "stagedSHA256": staged_digest})
        else:
            verified.append({"file": relative.as_posix(), "bytes": original_size,
                             "sha256": source_digest})
    return {
        "schemaVersion": 1,
        "readOnly": True,
        "source": str(approved_root),
        "stage": str(build_root),
        "approved": len(approved),
        "verified": len(verified),
        "errors": errors,
        "verifiedFiles": verified,
        "allApprovedFilesMatch": len(approved) > 0 and not errors,
        "limits": [
            "Only explicitly reviewed public files in the provided manifest are checked.",
            "No unlisted V1 source files, protected resources or PHP/Google services are checked.",
            "Re-run after all subsequent file operations; this is not a live-server verification."
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--approved-root", type=Path, required=True)
    parser.add_argument("--build-root", type=Path, required=True)
    parser.add_argument("--out", type=Path,
                        help="Report path OUTSIDE V2 Git repo; contains public-approved filenames")
    args = parser.parse_args()
    try:
        result = verify_public_assets(args.manifest, args.approved_root, args.build_root)
        if args.out:
            target = args.out.resolve()
            if target.is_relative_to(ROOT.resolve()):
                raise ValueError("Private migration report must be saved outside the V2 repository")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n",
                              encoding="utf-8")
        print(f"Verified {result['verified']}/{result['approved']} approved public files; "
              f"{len(result['errors'])} error(s). "
              f"Full details: {args.out if args.out else 'use --out outside Git'}")
        return 0 if result["allApprovedFilesMatch"] else 2
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"NTNU staging verification STOP: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
