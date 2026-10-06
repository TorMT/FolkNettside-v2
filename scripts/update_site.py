#!/usr/bin/env python3
"""Build the v2 course/content manifest from a semester folder tree.

The script intentionally has one job:
  folders + small course metadata -> data/content-manifest.json

It does not patch HTML, rewrite navigation, modify viewers, or deploy anything.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "examples" / "semesters"
DEFAULT_OUTPUT = ROOT / "data" / "content-manifest.json"

IGNORE_NAMES = {"course.json", "index.json", ".DS_Store", "Thumbs.db"}
KIND_BY_SUFFIX = {
    ".pdf": "PDF",
    ".md": "MD",
    ".txt": "TXT",
    ".py": "PY",
    ".js": "JS",
    ".mjs": "JS",
    ".ts": "TS",
    ".tsx": "TSX",
    ".jsx": "JSX",
    ".java": "JAVA",
    ".c": "C",
    ".cc": "CPP",
    ".cpp": "CPP",
    ".h": "H",
    ".hpp": "HPP",
    ".cs": "CS",
    ".json": "JSON",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".csv": "CSV",
    ".html": "HTML",
    ".htm": "HTML",
    ".tex": "TEX",
    ".ipynb": "IPYNB",
    ".doc": "DOC",
    ".docx": "DOCX",
    ".xls": "XLS",
    ".xlsx": "XLSX",
    ".ppt": "PPT",
    ".pptx": "PPTX",
    ".mp4": "VIDEO",
    ".webm": "VIDEO",
    ".mkv": "VIDEO",
    ".stl": "STL",
    ".3mf": "3MF",
    ".step": "STEP",
    ".stp": "STEP",
    ".iges": "IGES",
    ".igs": "IGES",
    ".f3d": "F3D",
    ".f3z": "F3Z",
}

def rel_web(path: Path) -> str:
    return path.resolve().relative_to(ROOT.resolve()).as_posix()

def detect_kind(path: Path) -> str:
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

def resource(path: Path, section: str, label: str | None = None) -> dict:
    stat = path.stat()
    return {
        "section": section,
        "name": path.name,
        "label": label or prettify(path.name),
        "path": "./" + rel_web(path),
        "kind": detect_kind(path),
        "size": stat.st_size,
        "modified": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
    }

def scan_course(semester_id: int, course_dir: Path) -> dict:
    meta_path = course_dir / "course.json"
    if not meta_path.exists():
        meta_path = course_dir / "index.json"
    meta = load_json(meta_path)

    code = str(meta.get("code") or meta.get("courseCode") or course_dir.name)
    section_order = list(meta.get("sectionOrder") or [])
    resources: list[dict] = []

    for path in sorted(course_dir.rglob("*"), key=lambda p: p.as_posix().lower()):
        if not path.is_file() or path.name in IGNORE_NAMES or path.name.startswith("."):
            continue
        relative = path.relative_to(course_dir)
        section = relative.parts[0] if len(relative.parts) > 1 else "Filer og ressurser"
        resources.append(resource(path, section))

    for extra in meta.get("extraResources", []):
        if not isinstance(extra, dict) or not extra.get("path"):
            continue
        path = ROOT / str(extra["path"])
        if not path.exists() or not path.is_file():
            raise FileNotFoundError(f"extra resource not found: {path}")
        resources.append(resource(path, str(extra.get("section") or "Filer og ressurser"), extra.get("label")))

    seen = set()
    deduped = []
    for item in resources:
        key = (item["section"], item["path"])
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

def build_manifest(source: Path) -> dict:
    semesters: list[dict] = []
    if not source.exists():
        raise FileNotFoundError(f"semester source not found: {source}")

    for semester_dir in sorted((p for p in source.iterdir() if p.is_dir()), key=lambda p: p.name):
        try:
            semester_id = int(semester_dir.name)
        except ValueError:
            continue

        courses = [
            scan_course(semester_id, course_dir)
            for course_dir in sorted((p for p in semester_dir.iterdir() if p.is_dir()), key=lambda p: p.name.casefold())
        ]
        semesters.append({"id": semester_id, "label": f"Semester {semester_id}", "courses": courses})

    return {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": rel_web(source),
        "semesters": semesters,
    }

def stable_for_check(data: dict) -> dict:
    clone = dict(data)
    clone.pop("generatedAt", None)
    for semester in clone.get("semesters", []):
        for course in semester.get("courses", []):
            for item in course.get("resources", []):
                item.pop("modified", None)
    return clone

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true", help="Fail if the committed manifest is stale")
    args = parser.parse_args()

    source = args.source if args.source.is_absolute() else ROOT / args.source
    output = args.output if args.output.is_absolute() else ROOT / args.output
    manifest = build_manifest(source)

    if args.check:
        if not output.exists():
            print(f"manifest missing: {output}", file=sys.stderr)
            return 1
        current = load_json(output)
        if stable_for_check(current) != stable_for_check(manifest):
            print("content manifest is stale; run: python scripts/update_site.py", file=sys.stderr)
            return 1
        print("content manifest is up to date")
        return 0

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total_courses = sum(len(s["courses"]) for s in manifest["semesters"])
    total_files = sum(len(c["resources"]) for s in manifest["semesters"] for c in s["courses"])
    print(f"Updated {output.relative_to(ROOT)}: {len(manifest['semesters'])} semester(s), {total_courses} course(s), {total_files} resource(s)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
