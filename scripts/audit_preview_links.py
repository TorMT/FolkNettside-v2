#!/usr/bin/env python3
"""Offline, read-only audit of local assets reachable from a built Pages entrypoint.

This is not a network, NTNU course-URL, or SPA-route availability test.
Only literal static dependencies are checked; computed JS imports are excluded.
"""
from __future__ import annotations

import argparse
import re
from collections import deque
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

CSS_URL = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.I | re.S)
CSS_IMPORT = re.compile(r"@import\s+(['\"])(.*?)\1", re.I)
CSS_COMMENTS = re.compile(r"/\*.*?\*/", re.S)
JS_MODULE = re.compile(
    r"\b(?:from\s*|import\s*(?:\(\s*)?)(['\"])(\.{1,2}/[^'\"\n]+?\.(?:js|mjs)(?:\?[^'\"\n]*)?)\1"
)
JS_URL = re.compile(
    r"\bnew\s+URL\(\s*(['\"])(\.{1,2}/[^'\"\n]+)\1\s*,\s*import\.meta\.url\s*\)"
)


def srcset_urls(value: str) -> list[str]:
    # Data: URLs are not local files. srcset parsing here covers literal
    # file links, not arbitrary embedded image data or complex media syntax.
    return [item.strip().split()[0] for item in value.split(",") if item.strip()]


class EntryReferences(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        attr = dict(attrs)
        key = {
            "script": "src", "img": "src", "iframe": "src", "object": "data",
            "video": "src", "audio": "src", "source": "src", "track": "src",
        }.get(tag)
        if key and attr.get(key):
            self.references.append(attr[key])
        if tag == "video" and attr.get("poster"):
            self.references.append(attr["poster"])
        if tag == "link" and attr.get("href") and (
            set(str(attr.get("rel") or "").lower().split())
            & {"stylesheet", "icon", "preload", "modulepreload", "manifest"}
        ):
            self.references.append(attr["href"])
        if tag in ("img", "source") and attr.get("srcset"):
            self.references.extend(srcset_urls(attr["srcset"]))


def local_target(root: Path, current: Path, reference: str) -> tuple[Path | None, str | None]:
    """Resolve literal relative paths safely; return (path, error type)."""
    raw = reference.strip()
    if not raw or raw.startswith(("#", "//")):
        return None, None
    try:
        parsed = urlsplit(raw)
    except ValueError:
        return None, "invalid local asset URL"
    if parsed.scheme or parsed.netloc:
        return None, None  # remote/data/mailto URLs are not probed
    value = unquote(parsed.path)
    if not value:
        return None, None
    if value.startswith(("/", "\\")) or "\\" in value or "\x00" in value:
        return None, "root-absolute or invalid local asset URL"
    target = (current.parent / value).resolve()
    if not target.is_relative_to(root.resolve()):
        return None, "local asset escapes Pages root"
    return target, None


def static_js_references(text: str) -> list[str]:
    return [match.group(2) for match in JS_MODULE.finditer(text)] + [
        match.group(2) for match in JS_URL.finditer(text)
    ]


def static_css_references(text: str) -> list[str]:
    stripped = CSS_COMMENTS.sub("", text)
    return ([match.group(2).strip() for match in CSS_URL.finditer(stripped)] +
            [match.group(2).strip() for match in CSS_IMPORT.finditer(stripped)])


def audit_preview_links(root: Path) -> list[str]:
    """Report missing/escaping local dependencies in reachable static assets."""
    root = root.resolve()
    index = root / "index.html"
    if not index.is_file():
        return ["index.html: missing entrypoint"]
    entry = EntryReferences()
    entry.feed(index.read_text(encoding="utf-8"))
    queue = deque((index, uri) for uri in entry.references)
    visited: set[Path] = set()
    problems: set[str] = set()

    while queue:
        source, uri = queue.popleft()
        target, error = local_target(root, source, uri)
        source_label = source.relative_to(root).as_posix()
        if error:
            problems.add(f"{source_label}: {error}")
            continue
        if target is None:
            continue
        target_label = target.relative_to(root).as_posix()
        if not target.is_file():
            problems.add(f"{source_label}: missing local asset {target_label}")
            continue
        if target in visited:
            continue
        visited.add(target)
        if target.suffix.lower() not in {".js", ".mjs", ".css"}:
            continue
        # Only locally reachable JS/CSS are recursively scanned. Computed
        # imports, runtime-generated assets and external origins are excluded.
        source_text = target.read_text(encoding="utf-8")
        refs = (static_css_references(source_text) if target.suffix.lower() == ".css"
                else static_js_references(source_text))
        queue.extend((target, ref) for ref in refs)
    return sorted(problems)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True, help="Built GitHub Pages directory")
    args = parser.parse_args()
    problems = audit_preview_links(args.root)
    if problems:
        for message in problems:
            print("BROKEN STATIC LINK:", message)
        return 1
    print("Local Pages entrypoint assets: all reachable literal references resolve (offline).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
