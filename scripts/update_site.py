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

def scan_semester(source: Path, semester_id: int, course_code: str | None = None) -> dict:
    semester_dir = source / str(semester_id)
    if not semester_dir.is_dir():
        raise FileNotFoundError(f"semester not found: {semester_dir}")

    course_dirs = sorted(
        (p for p in semester_dir.iterdir() if p.is_dir()),
        key=lambda p: p.name.casefold(),
    )
    if course_code:
        wanted = course_code.casefold()
        course_dirs = [p for p in course_dirs if p.name.casefold() == wanted]
        if not course_dirs:
            raise FileNotFoundError(f"course not found: {semester_dir / course_code}")

    courses = [scan_course(semester_id, course_dir) for course_dir in course_dirs]
    return {"id": semester_id, "label": f"Semester {semester_id}", "courses": courses}

def build_full_manifest(source: Path) -> dict:
    if not source.exists():
        raise FileNotFoundError(f"semester source not found: {source}")

    semester_ids = []
    for path in source.iterdir():
        if not path.is_dir():
            continue
        try:
            semester_ids.append(int(path.name))
        except ValueError:
            pass

    semesters = [scan_semester(source, semester_id) for semester_id in sorted(semester_ids)]
    return {
        "schemaVersion": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": rel_web(source),
        "semesters": semesters,
    }

def merge_scope(
    current: dict,
    source: Path,
    semester_id: int,
    course_code: str | None,
) -> dict:
    """Update only one semester/course while preserving the rest of the manifest."""
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
                 if str(item.get("code", "")).casefold() == course_code.casefold()),
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
    return result

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
        (path.name for path in (source / str(semester)).iterdir() if path.is_dir()),
        key=str.casefold,
    )
    print("Available courses:", ", ".join(courses) or "(none)")
    raw = input("Course code (Enter = whole semester, q = cancel): ").strip()
    if raw.lower() in {"q", "quit"}:
        raise KeyboardInterrupt
    if not raw:
        return semester, None
    matches = [course for course in courses if course.casefold() == raw.casefold()]
    if not matches:
        raise ValueError(f"Unknown course: {raw}")
    return semester, matches[0]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--semester", type=int, help="Only update one semester")
    parser.add_argument("--course", help="Only update one course; requires --semester")
    parser.add_argument("--check", action="store_true", help="Fail if the full committed manifest is stale")
    parser.add_argument("--interactive", action="store_true", help="Choose the semester and course from discovered folders")
    args = parser.parse_args()

    if args.interactive and (args.check or args.semester is not None or args.course):
        parser.error("--interactive cannot be combined with --check, --semester or --course")
    if args.course and args.semester is None:
        parser.error("--course requires --semester")
    if args.check and (args.semester is not None or args.course):
        parser.error("--check validates the full manifest and cannot be combined with a scope")

    source = args.source if args.source.is_absolute() else ROOT / args.source
    output = args.output if args.output.is_absolute() else ROOT / args.output
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

    if args.semester is None:
        manifest = build_full_manifest(source)
        scope = "all semesters"
    else:
        current = load_json(output) if output.exists() else {}
        manifest = merge_scope(current, source, args.semester, args.course)
        scope = f"semester {args.semester}"
        if args.course:
            scope += f" / {args.course}"

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

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    target_courses = [
        course
        for semester in manifest.get("semesters", [])
        if args.semester is None or int(semester["id"]) == args.semester
        for course in semester.get("courses", [])
        if not args.course or course["code"].casefold() == args.course.casefold()
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
