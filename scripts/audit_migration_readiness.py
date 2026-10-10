#!/usr/bin/env python3
"""Read-only V1 -> V2 content coverage preflight.

Do NOT claim a production migration is safe unless --legacy-site is a verified
snapshot of the actual NTNU webedit root, not merely the sparse V1 Git repo.
This tool inventories public course resource filenames and sizes. It never
copies, deletes, uploads, or opens their contents, and it never follows symlinks.

Examples:
  python scripts/audit_migration_readiness.py --legacy-repo ../FolkNettside
  python scripts/audit_migration_readiness.py --legacy-repo ../FolkNettside \
    --legacy-site /secure-snapshot/ntnu-folk --v2-root .
  python scripts/audit_migration_readiness.py --legacy-site X --out migration-audit.json
Exit code 0: proven file/metadata parity for available source inventory.
Exit code 2: missing source, unrepresented files or unresolved migration blockers.
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
COURSE_RE = re.compile(r"^[A-Za-z]{2,5}[0-9]{4,5}[A-Za-z]?$")
SECRET_SEGMENTS = frozenset({
    "private", "privat", "beskyttet", "protected", "restricted",
    "secrets", "secret", "credentials", "passord", "hemmelig"
})
PRIVATE_SUFFIX = frozenset({".p12", ".pfx", ".pem", ".key", ".env"})
IGNORE_FILES = frozenset({
    "index.html", "index.json", "course.json", "thumbs.db",
    ".ds_store", "desktop.ini", "readme.md"
})
SERVER_BLOCKERS = {
    "brewing_php": "includes/brewing/api",
    "rapt_php": "includes/rapt/api",
    "aps_php": "includes/aps/api",
    "quiz_leaderboard_php": "Quiz/leaderboard.php",
}
SERVICE_BLOCKERS = (
    "Google OAuth/Drive real-account cross-device verification",
    "Brewing PHP/RAPT/recipe/log API and stored historical data",
    "Autodesk APS native F3D conversion and token backend",
    "Quiz server-side leaderboard behaviour and persistence",
    "MedisinTimer sensitive-data storage/security and portability",
    "Dive Log cross-device Google sync",
    "Production NTNU deployment, cache, redirects and rollback tests",
)


def file_inventory(directory: Path) -> list[Path]:
    """List files without opening file content or following symlink children."""
    pending = [directory]
    found: list[Path] = []
    while pending:
        current = pending.pop()
        if not current.is_dir() or current.is_symlink():
            continue
        for path in current.iterdir():
            if path.is_symlink():
                continue
            if path.is_dir():
                pending.append(path)
            elif path.is_file():
                found.append(path)
    return sorted(found)


def protected(file: Path, root: Path) -> bool:
    rel = file.relative_to(root)
    segments = {part.casefold() for part in rel.parts}
    name = file.name.casefold()
    return bool(segments & SECRET_SEGMENTS or
                file.suffix.casefold() in PRIVATE_SUFFIX or
                name.startswith(".env") or "password" in name or
                "api_key" in name or "client_secret" in name)


def legacy_course_inventory(site_root: Path | None) -> tuple[dict, list[str], bool]:
    warnings: list[str] = []
    result: dict[str, dict] = {}
    if site_root is None or not site_root.is_dir():
        return result, ["No verified production webedit snapshot (--legacy-site)."], False

    semester_root = site_root / "semestre"
    if not semester_root.is_dir():
        return result, [
            "The supplied legacy snapshot has no semestre/ directory.",
            "The V1 GitHub repository alone is not proof of NTNU course content."
        ], False

    for semester in sorted(semester_root.iterdir()):
        if not semester.is_dir() or semester.is_symlink() or not semester.name.isdecimal():
            continue
        sid = int(semester.name)
        for course in sorted(semester.iterdir()):
            if not course.is_dir() or course.is_symlink():
                continue
            code = course.name.upper() if COURSE_RE.fullmatch(course.name.upper()) else None
            if code is None:
                warnings.append(f"Semester {sid} / {course.name}: requires reviewed slug-to-course-code mapping")
            public_files, excluded, symlinks = [], 0, 0
            for file in file_inventory(course):
                rel = file.relative_to(course)
                if file.name.casefold() in IGNORE_FILES or file.name.startswith("."):
                    continue
                if protected(file, course):
                    excluded += 1
                    continue
                public_files.append({
                    "name": file.name,
                    "size_bytes": file.stat().st_size,
                    "relative": rel.as_posix()
                })
            # Detect symlinks as a blocking manual-review issue; don't follow them.
            for child in course.rglob("*"):
                if child.is_symlink():
                    symlinks += 1
            if symlinks:
                warnings.append(f"{sid}/{code}: {symlinks} symlink(s) require manual classification")
            key = f"{sid}/{code or course.name}"
            result[key] = {
                "semester": sid, "code": code, "slug": course.name,
                "public_files": public_files,
                "excluded_protected_files": excluded,
                "symlinks_for_review": symlinks
            }
    if not result:
        warnings.append("No recognized semester/course folders in legacy site snapshot.")
    return result, warnings, bool(result)


def manifest_courses(v2_root: Path) -> tuple[dict, list[str]]:
    path = v2_root / "data" / "content-manifest.json"
    if not path.is_file():
        return {}, ["V2 content-manifest.json not found."]
    data = json.loads(path.read_text(encoding="utf-8"))
    courses, warnings = {}, []
    for semester in data.get("semesters", []):
        try:
            sid = int(semester["id"])
        except (KeyError, TypeError, ValueError):
            warnings.append("Malformed V2 semester entry")
            continue
        for item in semester.get("courses", []):
            code = str(item.get("code") or "").upper()
            if not COURSE_RE.fullmatch(code):
                warnings.append(f"Invalid V2 course code: semester {sid}")
                continue
            key = f"{sid}/{code}"
            if key in courses:
                warnings.append(f"Duplicate V2 course: {key}")
                continue
            items = []
            for resource in item.get("resources", []):
                if resource.get("source", "site") == "remote":
                    continue
                rel = str(resource.get("path") or "").removeprefix("./")
                target = (v2_root / rel).resolve()
                safe = target.is_relative_to(v2_root.resolve())
                if not safe or not target.is_file():
                    warnings.append(f"{key}: invalid/missing public V2 resource")
                    continue
                items.append({"name": target.name, "size_bytes": target.stat().st_size})
            courses[key] = items
    return courses, warnings


def audit(legacy_repo: Path | None, legacy_site: Path | None, v2_root: Path) -> dict:
    previous, warnings, production_inventory_found = legacy_course_inventory(legacy_site)
    new, v2_warnings = manifest_courses(v2_root)
    warnings.extend(v2_warnings)
    results = []
    for key in sorted(previous):
        source = previous[key]["public_files"]
        target = new.get(key, [])
        # Name + exact length detect missing/changed resources without reading
        # large files; a SHA-256 byte-for-byte comparison is a later release gate.
        lhs = collections.Counter((r["name"].casefold(), r["size_bytes"]) for r in source)
        rhs = collections.Counter((r["name"].casefold(), r["size_bytes"]) for r in target)
        missing = lhs - rhs
        missing_summary = [
            {"name": name, "size_bytes": size, "count": count}
            for (name, size), count in sorted(missing.items())
        ]
        results.append({
            "course": key,
            "legacy_public_count": len(source),
            "v2_public_count": len(target),
            "excluded_legacy_protected_count": previous[key]["excluded_protected_files"],
            "missing_legacy_public_files": missing_summary,
            "status": "covered-by-name-and-size" if key in new and not missing else "needs-migration"
        })
    blockers = []
    if not production_inventory_found:
        blockers.append("Verified NTNU production-course snapshot missing or empty.")
    if any(x["status"] != "covered-by-name-and-size" for x in results):
        blockers.append("V2 does not include all inventoried public V1 course resources.")
    if not new:
        blockers.append("V2 content-manifest course catalog is empty or invalid.")
    if warnings:
        blockers.append("Inventory warnings require resolution.")
    services = {}
    if legacy_repo and legacy_repo.is_dir():
        services = {name:(legacy_repo / rel).exists()
                    for name, rel in SERVER_BLOCKERS.items()}
    else:
        blockers.append("Legacy Git repository not supplied for service inventory.")
    blockers.extend(SERVICE_BLOCKERS)
    return {
        "schemaVersion": 1,
        "readOnly": True,
        "legacySnapshotProvided": production_inventory_found,
        "legacyCourses": len(previous),
        "v2Courses": len(new),
        "legacyPublicFiles": sum(len(x["public_files"]) for x in previous.values()),
        "v2ManifestPublicFiles": sum(len(x) for x in new.values()),
        "sourceServiceExists": services,
        "courses": results,
        "warnings": warnings,
        "manualReleaseBlockers": blockers,
        "goLiveApproved": False,
        "claim": "Name/size inventory comparison only; never proves functional parity or security."
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--legacy-repo", type=Path)
    parser.add_argument("--legacy-site", type=Path,
                        help="Verified read-only snapshot of actual NTNU folk/webedit root")
    parser.add_argument("--v2-root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--out", type=Path, help="Optional JSON audit report output")
    args = parser.parse_args(argv)
    if not args.v2_root.is_dir():
        parser.error("--v2-root must be a real directory")
    report = audit(args.legacy_repo, args.legacy_site, args.v2_root)
    output = json.dumps(report, ensure_ascii=False, indent=2)
    if args.out:
        args.out.write_text(output + "\n", encoding="utf-8")
    else:
        print(output)
    return 2 if report["manualReleaseBlockers"] else 0


if __name__ == "__main__":
    sys.exit(main())
