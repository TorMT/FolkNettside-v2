#!/usr/bin/env python3
"""Fast manifest updater for FolkNettside v2.

The updater deliberately never reads ordinary resource file contents.
Large PDFs, videos, CAD archives, etc. are treated as directory metadata only:
name, path, size and modified time.

Usage:
  python scripts/update_site.py
  python scripts/update_site.py --semester 5
  python scripts/update_site.py --semester 5 --course TMR4182
"""

from __future__ import annotations

import argparse
import copy
import json
import os
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "examples" / "semesters"
DEFAULT_OUTPUT = ROOT / "data" / "content-manifest.json"

IGNORE_NAMES = {"course.json", "index.json", ".DS_Store", "Thumbs.db"}
KIND_BY_SUFFIX = {
    ".pdf": "PDF", ".md": "MD", ".txt": "TXT", ".py": "PY",
    ".js": "JS", ".mjs": "JS", ".ts": "TS", ".tsx": "TSX", ".jsx": "JSX",
    ".java": "JAVA", ".c": "C", ".cc": "CPP", ".cpp": "CPP",
    ".h": "H", ".hpp": "HPP", ".cs": "CS",
    ".json": "JSON", ".yaml": "YAML", ".yml": "YAML",
    ".csv": "CSV", ".html": "HTML", ".htm": "HTML", ".tex": "TEX",
    ".ipynb": "IPYNB",
    ".doc": "DOC", ".docx": "DOCX", ".xls": "XLS", ".xlsx": "XLSX",
    ".ppt": "PPT", ".pptx": "PPTX",
    ".mp4": "VIDEO", ".webm": "VIDEO", ".mkv": "VIDEO", ".mov": "VIDEO",
    ".stl": "STL", ".3mf": "3MF", ".step": "STEP", ".stp": "STEP",
    ".iges": "IGES", ".igs": "IGES", ".f3d": "F3D", ".f3z": "F3Z",
}

def rel_web(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()

def detect_kind(path: Path) -> str:
    lower = path.name.lower()
    if lower.endswith(".vault.json"):
        return "VAULT"
    if lower.endswith(".quiz.json"):
        return "QUIZ"
    return KIND_BY_SUFFIX.get(path.suffix.lower(), path.suffix.lstrip(".").upper() or "FILE")

def prettify(name: str) -> str:
    stem = Path(name).stem.replace("_", " ").replace("-", " ")
    return " ".join(stem.split())

def load_json(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data

def walk_files(root: Path) -> Iterator[tuple[Path, os.stat_result]]:
    """Recursive scandir walk with one stat call per file.

    File contents are never opened here. This keeps large video/CAD files cheap.
    """
    stack = [root]
    while stack:
        directory = stack.pop()
        with os.scandir(directory) as entries:
            for entry in entries:
                if entry.name.startswith("."):
                    continue
                if entry.is_dir(follow_symlinks=False):
                    stack.append(Path(entry.path))
                    continue
                if not entry.is_file(follow_symlinks=False) or entry.name in IGNORE_NAMES:
                    continue
                yield Path(entry.path), entry.stat(follow_symlinks=False)

def resource(
    path: Path,
    course_dir: Path,
    stat: os.stat_result,
    section: str,
    label: str | None = None,
) -> dict:
    relative = path.relative_to(course_dir)
    nested = list(relative.parts[1:-1]) if len(relative.parts) > 2 else []
    return {
        "source": "site",
        "section": section,
        "folders": nested,
        "relativePath": relative.as_posix(),
        "name": path.name,
        "label": label or prettify(path.name),
        "path": "./" + rel_web(path),
        "kind": detect_kind(path),
        "size": stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
    }

def external_resource(item: dict, course_dir: Path) -> dict:
    url = str(item.get("url") or "").strip()
    if not url.startswith("https://"):
        raise ValueError(f"external resource must use https://: {url}")
    label = str(item.get("label") or url)
    provider = str(item.get("provider") or "remote").lower()
    resource_id = str(item.get("id") or f"{provider}:{url}")
    folders = item.get("folders") or []
    if not isinstance(folders, list):
        raise ValueError(f"external resource folders must be a list: {label}")
    return {
        "id": resource_id,
        "source": "remote",
        "provider": provider,
        "section": str(item.get("section") or "Filer og ressurser"),
        "folders": [str(folder) for folder in folders],
        "relativePath": str(item.get("relativePath") or label),
        "name": str(item.get("name") or label),
        "label": label,
        "path": url,
        "url": url,
        "kind": str(item.get("kind") or provider.upper()),
        **({"videoId": str(item["videoId"])} if item.get("videoId") else {}),
    }

def scan_course(semester_id: int, course_dir: Path) -> dict:
    meta_path = course_dir / "course.json"
    if not meta_path.exists():
        meta_path = course_dir / "index.json"
    meta = load_json(meta_path)

    code = str(meta.get("code") or meta.get("courseCode") or course_dir.name)
    section_order = list(meta.get("sectionOrder") or [])
    resources: list[dict] = []

    for path, stat in walk_files(course_dir):
        relative = path.relative_to(course_dir)
        section = relative.parts[0] if len(relative.parts) > 1 else "Filer og ressurser"
        resources.append(resource(path, course_dir, stat, section))

    for external in meta.get("externalResources", []):
        if not isinstance(external, dict):
            continue
        resources.append(external_resource(external, course_dir))

    for extra in meta.get("extraResources", []):
        if not isinstance(extra, dict) or not extra.get("path"):
            continue
        path = ROOT / str(extra["path"])
        if not path.exists() or not path.is_file():
            raise FileNotFoundError(f"extra resource not found: {path}")
        stat = path.stat()
        resources.append({
            "source": "site",
            "section": str(extra.get("section") or "Filer og ressurser"),
            "folders": [],
            "relativePath": path.name,
            "name": path.name,
            "label": str(extra.get("label") or prettify(path.name)),
            "path": "./" + rel_web(path),
            "kind": detect_kind(path),
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
        })

    resources.sort(key=lambda item: (
        item["section"].casefold(),
        [part.casefold() for part in item["folders"]],
        item["name"].casefold(),
    ))

    seen: set[tuple[str, str]] = set()
    deduped: list[dict] = []
    for item in resources:
        key = (item["section"], item.get("id") or item["path"])
        if key not in seen:
            seen.add(key)
            deduped.append(item)

    sections_present = {item["section"] for item in deduped}
    ordered_sections = [s for s in section_order if s in sections_present]
    ordered_sections += sorted(sections_present - set(ordered_sections), key=str.casefold)

    return {
        "semester": semester_id,
        "code": code,
        "title": str(meta.get("title") or code),
        "description": str(meta.get("description") or ""),
        "tags": list(meta.get("tags") or []),
        "sections": ordered_sections,
        "resources": deduped,
    }

def course_metadata_code(course_dir: Path) -> str:
    """Resolve the actual course code without scanning files or resource bytes."""
    meta = course_dir / "course.json"
    if not meta.is_file():
        meta = course_dir / "index.json"
    data = load_json(meta)
    return str(data.get("code") or data.get("courseCode") or course_dir.name)


def resolve_course_dir(semester_dir: Path, course_name: str) -> Path:
    """Accept folder or declared course code; reject ambiguous matches."""
    candidates = sorted(
        (p for p in semester_dir.iterdir() if p.is_dir() and not p.is_symlink()),
        key=lambda p: p.name.casefold(),
    )
    matches = [p for p in candidates
               if course_name.casefold() in (p.name.casefold(), course_metadata_code(p).casefold())]
    if not matches:
        raise FileNotFoundError(f"course not found: {semester_dir / course_name}")
    if len(matches) > 1:
        raise ValueError(f"ambiguous course name/code: {course_name}")
    return matches[0]


def verify_unique_course_routes(manifest: dict) -> None:
    """Fail closed on ambiguous semester/course routes before publication.

    URL routing treats semester IDs as integers and course slugs
    case-insensitively. Two entries targeting the same route cannot be
    safely navigated or selectively updated.
    """
    seen_semesters: set[int] = set()
    for semester in manifest.get("semesters", []):
        sid = semester.get("id")
        if type(sid) is not int or sid < 1:
            raise ValueError("Invalid semester ID in public manifest")
        if sid in seen_semesters:
            raise ValueError(f"Duplicate semester ID {sid} in public manifest")
        seen_semesters.add(sid)
        seen_codes: set[str] = set()
        for course in semester.get("courses", []):
            code = course.get("code")
            if not isinstance(code, str) or not code.strip():
                raise ValueError(f"Missing course code in semester {sid}")
            normalized = code.casefold()
            if normalized in seen_codes:
                raise ValueError(f"Duplicate course route in semester {sid}: {code}")
            seen_codes.add(normalized)


def scan_semester(source: Path, semester_id: int, course_code: str | None = None) -> dict:
    semester_dir = source / str(semester_id)
    if not semester_dir.is_dir():
        raise FileNotFoundError(f"semester not found: {semester_dir}")

    course_dirs = sorted(
        (p for p in semester_dir.iterdir() if p.is_dir() and not p.is_symlink()),
        key=lambda p: p.name.casefold(),
    )
    if course_code:
        course_dirs = [resolve_course_dir(semester_dir, course_code)]

    courses = [scan_course(semester_id, course_dir) for course_dir in course_dirs]
    semester = {"id": semester_id, "label": f"Semester {semester_id}", "courses": courses}
    verify_unique_course_routes({"semesters": [semester]})
    return semester

def build_full_manifest(source: Path) -> dict:
    if not source.exists():
        raise FileNotFoundError(f"semester source not found: {source}")

    semester_ids = []
    for path in source.iterdir():
        if not path.is_dir() or path.is_symlink():
            continue
        try:
            semester_id = int(path.name)
        except ValueError:
            continue
        if semester_id < 1 or str(semester_id) != path.name:
            raise ValueError(f"Noncanonical semester directory name: {path.name}")
        semester_ids.append(semester_id)

    semesters = [scan_semester(source, semester_id) for semester_id in sorted(semester_ids)]
    manifest = {
        "schemaVersion": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": rel_web(source),
        "semesters": semesters,
    }
    verify_unique_course_routes(manifest)
    return manifest

def merge_scope(
    current: dict,
    source: Path,
    semester_id: int,
    course_code: str | None,
) -> dict:
    """Update only one semester/course while preserving the rest of the manifest."""
    if current:
        verify_unique_course_routes(current)
    result = copy.deepcopy(current) if current else {
        "schemaVersion": 2,
        "source": rel_web(source),
        "semesters": [],
    }
    result["schemaVersion"] = 2
    result["source"] = rel_web(source)
    result["generatedAt"] = datetime.now(timezone.utc).isoformat()

    semesters = list(result.get("semesters") or [])
    index = next((i for i, item in enumerate(semesters) if int(item.get("id", -1)) == semester_id), None)

    if course_code is None:
        scanned = scan_semester(source, semester_id)
        if index is None:
            semesters.append(scanned)
        else:
            semesters[index] = scanned
    else:
        scanned_course = scan_semester(source, semester_id, course_code)["courses"][0]
        if index is None:
            semesters.append({
                "id": semester_id,
                "label": f"Semester {semester_id}",
                "courses": [scanned_course],
            })
        else:
            semester = copy.deepcopy(semesters[index])
            courses = list(semester.get("courses") or [])
            course_index = next(
                (i for i, item in enumerate(courses)
                 if str(item.get("code", "")).casefold() == scanned_course["code"].casefold()),
                None,
            )
            if course_index is None:
                courses.append(scanned_course)
            else:
                courses[course_index] = scanned_course
            courses.sort(key=lambda item: str(item.get("code", "")).casefold())
            semester["courses"] = courses
            semesters[index] = semester

    semesters.sort(key=lambda item: int(item.get("id", 0)))
    result["semesters"] = semesters
    verify_unique_course_routes(result)
    return result

def manifest_removal_counts(previous: dict, updated: dict) -> tuple[int, int]:
    """Detect disappearing approved course routes and resource links.

    Counts refer to public *manifest references*, never course file bytes.
    Moving/renaming a file changes its link and is intentionally treated as
    a removal until the operator explicitly reviews the update.
    """
    if not previous:
        return 0, 0
    if not isinstance(previous.get("semesters"), list):
        raise ValueError("Existing manifest is missing its semesters array")
    verify_unique_course_routes(previous)
    verify_unique_course_routes(updated)

    def flatten(manifest: dict) -> dict[tuple[int, str], set[str]]:
        courses: dict[tuple[int, str], set[str]] = {}
        for semester in manifest["semesters"]:
            for course in semester.get("courses", []):
                identifiers = set()
                for resource in course.get("resources", []):
                    identity = resource.get("path") or resource.get("url") or (
                        resource.get("relativePath") or resource.get("id"))
                    if not isinstance(identity, str) or not identity:
                        raise ValueError("Existing course contains a resource without a stable link")
                    identifiers.add(identity)
                courses[semester["id"], course["code"].casefold()] = identifiers
        return courses

    old = flatten(previous)
    new = flatten(updated)
    removed_courses = len(old.keys() - new.keys())
    removed_files = sum(len(files - new.get(key, set()))
                        for key, files in old.items())
    return removed_courses, removed_files


def stable_for_check(data: dict) -> dict:
    clone = copy.deepcopy(data)
    clone.pop("generatedAt", None)
    for semester in clone.get("semesters", []):
        for course in semester.get("courses", []):
            for item in course.get("resources", []):
                item.pop("modified", None)
    return clone

def choose_scope(source: Path) -> tuple[int | None, str | None]:
    """Prompt for a scope; empty input means all. No hardcoded semesters/courses."""
    if not source.is_dir():
        raise FileNotFoundError(f"semester source not found: {source}")
    semester_ids = sorted(
        int(path.name) for path in source.iterdir()
        if path.is_dir() and path.name.isdecimal()
    )
    print("Available semesters:", ", ".join(map(str, semester_ids)) or "(none)")
    raw = input("Semester number (Enter = all, q = cancel): ").strip()
    if raw.lower() in {"q", "quit"}:
        raise KeyboardInterrupt
    if not raw:
        return None, None
    if not raw.isdecimal() or int(raw) not in semester_ids:
        raise ValueError(f"Unknown semester: {raw}")
    semester = int(raw)
    courses = sorted(
        (path for path in (source / str(semester)).iterdir()
         if path.is_dir() and not path.is_symlink()),
        key=lambda path: path.name.casefold(),
    )
    print("Available courses:", ", ".join(
        path.name + (" [" + course_metadata_code(path) + "]"
                     if course_metadata_code(path).casefold() != path.name.casefold() else "")
        for path in courses
    ) or "(none)")
    raw = input("Course folder or code (Enter = whole semester, q = cancel): ").strip()
    if raw.lower() in {"q", "quit"}:
        raise KeyboardInterrupt
    if not raw:
        return semester, None
    try:
        selected = resolve_course_dir(source / str(semester), raw)
    except FileNotFoundError:
        raise ValueError(f"Unknown course: {raw}") from None
    return semester, course_metadata_code(selected)


def public_manifest_violations(manifest: dict) -> list[tuple[str, str]]:
    """Check public course metadata with the same resource guard as CI."""
    import runpy
    guard = runpy.run_path(str(ROOT / "scripts" / "audit_public_assets.py"))
    return guard["validate_manifest"](manifest)


def write_manifest_atomic(output: Path, manifest: dict) -> None:
    """Avoid truncated manifest files on interruption or write failures."""
    output.parent.mkdir(parents=True, exist_ok=True)
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=output.parent,
            prefix=f".{output.name}.", suffix=".tmp", delete=False
        ) as stream:
            temp_path = Path(stream.name)
            json.dump(manifest, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_path, output)
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


def backup_manifest(output: Path, backup_dir: Path) -> Path | None:
    """Snapshot metadata only, atomically, before a substantive change."""
    if not output.is_file():
        return None
    backup_dir.mkdir(parents=True, exist_ok=True)
    # Directory names remain sortable; two rapid writes never overwrite.
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    destination = backup_dir / f"{stamp}-{output.name}"
    with tempfile.NamedTemporaryFile(mode="wb", dir=backup_dir, delete=False) as tmp:
        temp = Path(tmp.name)
        try:
            with output.open("rb") as previous:
                import shutil
                shutil.copyfileobj(previous, tmp)
            tmp.flush()
            os.fsync(tmp.fileno())
        except Exception:
            temp.unlink(missing_ok=True)
            raise
    os.replace(temp, destination)
    return destination


def restore_manifest(snapshot: Path, output: Path, backup_dir: Path) -> Path | None:
    """Restore explicitly selected metadata; never restore course files."""
    if not snapshot.is_file() or snapshot.is_symlink():
        raise ValueError("A readable, regular snapshot file is required")
    restored = load_json(snapshot)
    if not isinstance(restored.get("semesters"), list):
        raise ValueError("Snapshot missing semesters array")
    verify_unique_course_routes(restored)
    violations = public_manifest_violations(restored)
    if violations:
        raise ValueError("Snapshot includes protected paths")
    # The snapshot source must still exist and be contained in the repository.
    configured = restored.get("source")
    if not isinstance(configured, str) or not configured:
        raise ValueError("Snapshot has no semester source")
    source_path = Path(configured)
    if source_path.is_absolute() or ".." in source_path.parts:
        raise ValueError("Unsafe snapshot course source")
    if not (ROOT / source_path).resolve().is_relative_to(ROOT.resolve()):
        raise ValueError("Snapshot source escapes repository")
    if not (ROOT / source_path).is_dir():
        raise ValueError("Snapshot course source directory is missing")
    previous = backup_manifest(output, backup_dir)
    write_manifest_atomic(output, restored)
    return previous


def manifest_source(output: Path) -> Path:
    """Honor a reviewed course root recorded in the manifest during rebuild.

    Never silently replace migrated courses with demo fixtures, and never
    follow source pointers outside the repository.
    """
    # Example fixtures are a safe default only for the very first build.
    # A pre-existing manifest is evidence of an already selected course
    # source. Missing/blank metadata must never silently replace it.
    if not output.exists() and not output.is_symlink():
        return DEFAULT_SOURCE
    if not output.is_file() or output.is_symlink():
        raise ValueError("existing manifest is not a regular file")
    configured = load_json(output).get("source")
    if not isinstance(configured, str) or not configured.strip():
        raise ValueError("existing manifest has no reviewed semester source")
    source_label = Path(configured)
    if source_label.is_absolute() or ".." in source_label.parts:
        raise ValueError("unsafe manifest source: outside repository")
    source = (ROOT / source_label).resolve()
    if (source == ROOT.resolve() or
            not source.is_relative_to(ROOT.resolve()) or not source.is_dir()):
        raise ValueError("manifest course source is missing or outside repository")
    return source


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, help="Semester root (defaults to current manifest source)")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--semester", type=int, help="Only update one semester")
    parser.add_argument("--course", help="Only update one course; requires --semester")
    parser.add_argument("--check", action="store_true", help="Fail if the full committed manifest is stale")
    parser.add_argument("--dry-run", action="store_true", help="Preview the manifest without writing it")
    parser.add_argument("--allow-removals", action="store_true",
                        help="Explicitly permit deleting manifest links after reviewing the change; creates a backup")
    parser.add_argument("--interactive", action="store_true", help="Choose the semester and course from discovered folders")
    parser.add_argument("--backup-dir", type=Path, default=ROOT / ".siteupdater-backups" / "v2-manifests",
                        help="Local manifest snapshots before substantive changes")
    parser.add_argument("--restore-manifest", type=Path,
                        help="Restore one explicit manifest snapshot; does not restore course file bytes")
    args = parser.parse_args()

    if args.restore_manifest and (
        args.interactive or args.check or args.dry_run or
        args.semester is not None or args.course or args.source
    ):
        parser.error("--restore-manifest cannot be combined with scanning options")
    if args.restore_manifest:
        output = args.output if args.output.is_absolute() else ROOT / args.output
        backup_dir = args.backup_dir if args.backup_dir.is_absolute() else ROOT / args.backup_dir
        try:
            previous = restore_manifest(args.restore_manifest, output, backup_dir)
        except (ValueError, OSError) as error:
            print(f"Restore cancelled: {error}; manifest unchanged.", file=sys.stderr)
            return 2
        print(f"Restored manifest from {args.restore_manifest}. Previous version: {previous or 'none'}")
        print("Only manifest metadata was restored; original course files were not modified.")
        return 0

    if args.interactive and (args.check or args.semester is not None or args.course):
        parser.error("--interactive cannot be combined with --check, --semester or --course")
    if args.check and args.dry_run:
        parser.error("--check and --dry-run cannot be combined")
    if args.course and args.semester is None:
        parser.error("--course requires --semester")
    if args.check and (args.semester is not None or args.course):
        parser.error("--check validates the full manifest and cannot be combined with a scope")

    output = args.output if args.output.is_absolute() else ROOT / args.output
    try:
        chosen_source = args.source if args.source is not None else manifest_source(output)
    except (ValueError, OSError) as error:
        print(f"Content source error: {error}. No files changed.", file=sys.stderr)
        return 2
    source = chosen_source if chosen_source.is_absolute() else ROOT / chosen_source
    started = time.perf_counter()
    if args.interactive:
        try:
            args.semester, args.course = choose_scope(source)
        except (KeyboardInterrupt, EOFError):
            print("\\nCancelled. No files changed.")
            return 0
        except (ValueError, FileNotFoundError) as error:
            print(f"Selection error: {error}. No files changed.", file=sys.stderr)
            return 2

    try:
        if args.semester is None:
            manifest = build_full_manifest(source)
            scope = "all semesters"
        else:
            current = load_json(output) if output.exists() else {}
            manifest = merge_scope(current, source, args.semester, args.course)
            scope = f"semester {args.semester}"
            if args.course:
                scope += f" / {args.course}"
    except (OSError, ValueError, TypeError) as error:
        print(f"SiteUpdater scan cancelled: {error}. Manifest unchanged.", file=sys.stderr)
        return 2

    violations = public_manifest_violations(manifest)
    if violations:
        for path, problem in violations:
            print(f"Unsafe public resource: {path} ({problem})", file=sys.stderr)
        print("No manifest written; move protected files outside public sources.", file=sys.stderr)
        return 2

    # A partially copied/mounted directory can be scanned successfully but
    # would otherwise erase previously published course/file references.
    # Reject any loss by default, for full and scoped updates alike.
    try:
        existing = load_json(output) if output.exists() else {}
        removed_courses, removed_files = manifest_removal_counts(existing, manifest)
    except (ValueError, TypeError, KeyError) as error:
        print(f"SiteUpdater removal check cancelled: {error}. Manifest unchanged.",
              file=sys.stderr)
        return 2
    if removed_courses or removed_files:
        summary = (f"{removed_courses} course(s), {removed_files} file link(s)")
        if not args.allow_removals:
            print("SiteUpdater refused to remove " + summary +
                  ". Restore the missing source or review and rerun with "
                  "--allow-removals. Manifest unchanged.", file=sys.stderr)
            return 2
        print("Reviewed removal override: " + summary +
              ". A metadata snapshot will be saved before any changed manifest write.")

    if args.check:
        if not output.exists():
            print(f"manifest missing: {output}", file=sys.stderr)
            return 1
        current = load_json(output)
        if stable_for_check(current) != stable_for_check(manifest):
            print("content manifest is stale; run: python scripts/update_site.py", file=sys.stderr)
            return 1
        print(f"content manifest is up to date ({time.perf_counter()-started:.3f}s)")
        return 0

    if args.dry_run:
        current = load_json(output) if output.exists() else {}
        changed = stable_for_check(current) != stable_for_check(manifest)
        state = "updated" if changed else "unchanged"
        print(f"DRY RUN: {scope}; manifest would be {state}. No files changed.")
        return 0

    old = load_json(output) if output.exists() else {}
    if stable_for_check(old) != stable_for_check(manifest):
        backup_dir = args.backup_dir if args.backup_dir.is_absolute() else ROOT / args.backup_dir
        snapshot = backup_manifest(output, backup_dir)
        if snapshot:
            print(f"Previous manifest snapshot: {snapshot}")
    write_manifest_atomic(output, manifest)

    selected_code = (course_metadata_code(resolve_course_dir(source / str(args.semester), args.course))
                     if args.course else None)
    target_courses = [
        course
        for semester in manifest.get("semesters", [])
        if args.semester is None or int(semester["id"]) == args.semester
        for course in semester.get("courses", [])
        if not selected_code or course["code"].casefold() == selected_code.casefold()
    ]
    total_files = sum(len(course["resources"]) for course in target_courses)
    video_files = sum(
        1 for course in target_courses for item in course["resources"]
        if item["kind"] == "VIDEO"
    )
    elapsed = time.perf_counter() - started
    print(
        f"Updated {scope}: {len(target_courses)} course(s), "
        f"{total_files} resource(s), {video_files} video(s) in {elapsed:.3f}s"
    )
    print("Large resources were indexed from filesystem metadata only; contents were not read.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
