#!/usr/bin/env python3
"""Local, explicit-public-allowlist NTNU catalog preview. No writes to webedit.

Usage:
  python scripts/preview_ntnu_autocatalog.py --webroot W:\webedit-root \
    --allowlist data/ntnu-index-allowlist.example.json
  python scripts/preview_ntnu_autocatalog.py --webroot W:\webedit-root \
    --allowlist ... --output C:\private-build\ntnu-autocatalog.json

Only stat metadata is read from resource files; content bytes are never opened.
Course visibility is checked against existing NTNU course/semester indexes.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import stat
import tempfile
from pathlib import Path
from urllib.parse import quote

PRIVATE = re.compile(r"beskyttet|protected|private|privat|restricted|hemmelig|"
                     r"secret|credential|passord|password|token|\.env|\.htaccess", re.I)
KINDS = {
    ".pdf":"PDF", ".py":"PY", ".ipynb":"IPYNB", ".csv":"CSV",
    ".xlsx":"XLSX", ".xls":"XLS", ".docx":"DOCX", ".doc":"DOC",
    ".pptx":"PPTX", ".ppt":"PPT", ".json":"JSON", ".txt":"TXT",
    ".html":"HTML", ".htm":"HTML", ".md":"MD", ".tex":"TEX",
    ".stl":"STL", ".3mf":"3MF", ".obj":"OBJ", ".glb":"GLB",
    ".step":"STEP", ".stp":"STEP", ".iges":"IGES", ".igs":"IGES",
    ".f3d":"F3D", ".f3z":"F3Z", ".z012rs":"Z012RS",
    ".z014rs":"Z014RS", ".zip":"ZIP", ".mp4":"VIDEO", ".webm":"VIDEO",
    ".png":"IMAGE", ".jpg":"IMAGE", ".jpeg":"IMAGE", ".webp":"IMAGE",
    ".svg":"IMAGE", ".wav":"AUDIO", ".mp3":"AUDIO",
}
ALLOWED_SECTIONS = {"filer", "quiz"}
SKIP_NAMES = {"index.html", "index.json", "thumbs.db", ".ds_store"}
MAX_FILES = 25000


def safe_component(value):
    return (isinstance(value, str) and 0 < len(value) <= 210
            and value not in {".", ".."} and not value.startswith((".", "~$"))
            and not PRIVATE.search(value)
            and not any(c in value for c in "\\/%?#")
            and not any(ord(c) < 32 or ord(c) == 127 for c in value))


def safe_regular(path: Path):
    try:
        mode = path.lstat().st_mode
        return stat.S_ISREG(mode)
    except OSError:
        return False


def public_json(path: Path):
    if not safe_regular(path) or path.stat().st_size > 4_000_000:
        raise ValueError("Required reviewed public index is missing or invalid")
    with path.open("r", encoding="utf-8") as fd:
        data = json.load(fd)
    if not isinstance(data, dict):
        raise ValueError("Expected public index object")
    return data


def approved_courses(root: Path, allowlist: dict):
    entries = allowlist.get("publicCourses")
    if not isinstance(entries, list) or not entries or len(entries) > 500:
        raise ValueError("A reviewed non-empty publicCourses allowlist is required")
    unique = set()
    for item in entries:
        if not isinstance(item, dict):
            raise ValueError("Invalid allowlist entry")
        sid, slug = item.get("semester"), item.get("slug")
        sections = item.get("sections")
        if not type(sid) is int or sid < 1 or sid > 20 or not safe_component(slug):
            raise ValueError("Unsafe course identifier")
        if (not isinstance(sections, list) or not sections or
            len(sections) != len(set(sections)) or
            any(s not in ALLOWED_SECTIONS for s in sections)):
            raise ValueError("Only approved public filer/quiz sections are allowed")
        if (sid, slug) in unique:
            raise ValueError("Duplicate approved course")
        unique.add((sid, slug))
        semester_index = public_json(root / "semestre" / str(sid) / "index.json")
        record = semester_index.get(slug)
        if not isinstance(record, dict) or record.get("beskyttet") is not False:
            raise ValueError("Course is not explicitly public in existing NTNU index")
        if record.get("dir", slug) != slug:
            raise ValueError("Legacy public index directory mismatch")
        course_dir = root / "semestre" / str(sid) / slug
        if not course_dir.is_dir() or course_dir.is_symlink():
            raise ValueError("Approved course folder missing or symlinked")
        course_index = public_json(course_dir / "index.json")
        for section in sections:
            section_spec = course_index.get(section)
            if section == "quiz":
                if not (isinstance(section_spec, str)
                        and section_spec.startswith("quiz/")):
                    raise ValueError("Quiz must be explicitly indexed as public")
            elif not (isinstance(section_spec, dict)
                      and section_spec.get("beskyttet") is False):
                raise ValueError("Section is not explicitly public in existing course index")
        title = item.get("title", slug)
        if not isinstance(title, str) or not title.strip() or len(title) > 130:
            raise ValueError("Invalid public course title")
        yield sid, slug, title.strip(), sections, course_dir


def walk_section(base: Path):
    """Metadata only. No symlink following; refuse deep/excessive public trees."""
    if not base.is_dir() or base.is_symlink():
        raise ValueError("Approved public section missing or symlinked")
    stack = [(base, 0)]
    while stack:
        directory, depth = stack.pop()
        if depth > 14:
            raise ValueError("Public section exceeds directory depth budget")
        with os.scandir(directory) as handle:
            entries = sorted(handle, key=lambda e: e.name.casefold())
        for entry in entries:
            if not safe_component(entry.name) or entry.name.lower() in SKIP_NAMES:
                continue
            if entry.is_symlink():
                continue
            if entry.is_dir(follow_symlinks=False):
                stack.append((Path(entry.path), depth + 1))
            elif entry.is_file(follow_symlinks=False):
                if Path(entry.name).suffix.lower() not in KINDS:
                    continue
                yield Path(entry.path), entry.stat(follow_symlinks=False)


def build_catalog(webroot: Path, allowlist: dict):
    root = webroot.resolve(strict=True)
    if not (root / "index.html").is_file() or not (root / "semestre").is_dir():
        raise ValueError("This does not look like the approved NTNU webedit root")
    semesters = {}
    total = 0
    for sid, slug, title, sections, course_dir in approved_courses(root, allowlist):
        resources = []
        for section in sections:
            base = course_dir / section
            for source, info in walk_section(base):
                total += 1
                if total > MAX_FILES:
                    raise ValueError("Public catalog exceeds global file budget")
                relative = source.relative_to(course_dir)
                path = "/semestre/" + str(sid) + "/" + quote(slug, safe="") + "/" + "/".join(
                    quote(component, safe="") for component in relative.parts)
                folders = list(relative.parts[1:-1])
                item = {
                    "source":"ntnu", "name":source.name,
                    "label":source.stem.replace("_"," ").replace("-"," "),
                    "relativePath":relative.as_posix(), "path":path,
                    "url":"https://tormt.folk.ntnu.no" + path,
                    "section":section, "folders":folders,
                    "kind":"QUIZ" if section == "quiz" and
                       re.fullmatch(r"quiz(?:_[a-z0-9-]+)?\.json", source.name, re.I)
                       else KINDS[source.suffix.lower()],
                    "size":info.st_size,
                    "modified":int(info.st_mtime)
                }
                resources.append(item)
        resources.sort(key=lambda x: (x["section"], x["relativePath"].casefold()))
        course = {"semester":sid,"code":slug,"title":title,"tags":["NTNU"],
                  "description":"Originalfiler på NTNU", "resources":resources,
                  "sections":sorted({r["section"] for r in resources})}
        semesters.setdefault(sid, []).append(course)
    return {"schemaVersion":2,"source":"ntnu-auto-preview",
            "semesters":[{"id":sid,"label":f"Semester {sid}",
                          "courses":sorted(courses,key=lambda c:c["code"].casefold())}
                         for sid,courses in sorted(semesters.items())]}


def save_preview(catalog: dict, webroot: Path, destination: Path):
    root = webroot.resolve(strict=True)
    target = destination.absolute()
    # Never write to the NTNU tree, even if a future refactor accidentally
    # passes a live path. Refuse links in ancestor chain as well.
    if target == root or target.is_relative_to(root) or target.is_symlink():
        raise ValueError("Preview output must be outside NTNU webedit")
    for parent in (target.parent, *target.parent.parents):
        if parent.is_symlink():
            raise ValueError("Symlinked preview output parent")
    if not target.parent.is_dir():
        raise ValueError("Preview output parent must already exist")
    raw = (json.dumps(catalog,ensure_ascii=False,indent=2)+"\n").encode("utf-8")
    if target.is_file() and target.read_bytes() == raw:
        return {"changed":False,"bytes":len(raw)}
    fd, staging = tempfile.mkstemp(prefix=".ntnu-index-",dir=target.parent)
    try:
        with os.fdopen(fd,"wb") as out:
            out.write(raw);out.flush();os.fsync(out.fileno())
        os.replace(staging,target)
    finally:
        if os.path.exists(staging):
            os.unlink(staging)
    return {"changed":True,"bytes":len(raw)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--webroot",required=True,type=Path)
    parser.add_argument("--allowlist",required=True,type=Path)
    parser.add_argument("--output",type=Path,help="Opt-in LOCAL preview outside webedit")
    args = parser.parse_args()
    allowlist = public_json(args.allowlist)
    catalog = build_catalog(args.webroot, allowlist)
    courses = [course for s in catalog["semesters"] for course in s["courses"]]
    public_count = sum(len(course["resources"]) for course in courses)
    summary = {"dryRun":not bool(args.output),"publicCourses":len(courses),
               "publicResources":public_count,
               "semesters":len(catalog["semesters"])}
    if args.output:
        summary.update(save_preview(catalog,args.webroot,args.output))
    print(json.dumps(summary,ensure_ascii=False,indent=2))


if __name__ == "__main__":
    main()
