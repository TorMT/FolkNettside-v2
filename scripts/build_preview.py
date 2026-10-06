#!/usr/bin/env python3
"""Create a cache-busted static deployment tree for GitHub Pages."""

from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / ".deploy"
COPY_DIRS = ("assets", "src", "config", "data", "examples")
COPY_FILES = ("index.html",)

STATIC_IMPORT = re.compile(
    r'(?P<prefix>(?:from\s*|import\s*\(\s*)["\'])(?P<path>\.{1,2}/[^"\']+?\.js)(?P<suffix>["\'])'
)
WORKER_URL = re.compile(
    r'(?P<prefix>new\s+URL\(\s*["\'])(?P<path>\.{1,2}/[^"\']+?\.js)(?P<suffix>["\']\s*,\s*import\.meta\.url\s*\))'
)

def with_version(path: str, version: str) -> str:
    if "?v=" in path:
        return path
    separator = "&" if "?" in path else "?"
    return f"{path}{separator}v={version}"

def stamp_js(text: str, version: str) -> str:
    def replace(match: re.Match[str]) -> str:
        return f"{match.group('prefix')}{with_version(match.group('path'), version)}{match.group('suffix')}"
    text = STATIC_IMPORT.sub(replace, text)
    text = WORKER_URL.sub(replace, text)
    return text

def stamp_index(text: str, version: str) -> str:
    text = re.sub(
        r'(<script\s+type="module"\s+src=")(\./src/app\.js)(?=")',
        lambda m: m.group(1) + with_version(m.group(2), version),
        text,
    )
    text = re.sub(
        r'(<link\s+rel="stylesheet"\s+href=")(\./assets/style\.css)(?=")',
        lambda m: m.group(1) + with_version(m.group(2), version),
        text,
    )
    return text

def build(version: str, output: Path) -> None:
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    for filename in COPY_FILES:
        shutil.copy2(ROOT / filename, output / filename)

    for dirname in COPY_DIRS:
        shutil.copytree(ROOT / dirname, output / dirname)

    for path in (output / "src").rglob("*.js"):
        path.write_text(stamp_js(path.read_text(encoding="utf-8"), version), encoding="utf-8")

    index = output / "index.html"
    index.write_text(stamp_index(index.read_text(encoding="utf-8"), version), encoding="utf-8")

    (output / "build.txt").write_text(version + "\n", encoding="utf-8")
    (output / ".nojekyll").write_text("", encoding="utf-8")

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", required=True)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    output = args.output if args.output.is_absolute() else ROOT / args.output
    build(args.version.strip(), output)
    print(f"Built {output.relative_to(ROOT)} with version {args.version}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
