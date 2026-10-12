#!/usr/bin/env python3
"""Read-only HTTP smoke test for NTNU V2 staging, never production writes.

Queries only known public index and V2 application endpoints.
Use after a manual webedit staging release, not against protected content.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

ORIGIN = "https://tormt.folk.ntnu.no"
PATHS = (
    "/v2-staging/",
    "/v2-staging/index.html",
    "/v2-staging/src/app.js",
    "/v2-staging/src/courses/ntnu-catalog.js",
    "/v2-staging/scripts/fusion_export_folknet.py",
    "/v2-staging/build.txt",
    "/semestre/index.json",
    "/semestre/1/index.json",
    "/semestre/5/index.json",
)
MAX_BYTES = 4_000_000


def fetch_public(path: str, *, fetcher=urllib.request.urlopen):
    if not path.startswith("/") or "//" in path or "?" in path or "#" in path:
        raise ValueError("Invalid smoke URL")
    url = ORIGIN + path
    req = urllib.request.Request(url, headers={
        "User-Agent": "FolkNetV2-StagingQA/1.0",
        "Accept": "application/json,text/plain,text/html,*/*",
        "Cache-Control": "no-cache"
    })
    with fetcher(req, timeout=15) as response:
        final_url = response.geturl()
        if (urlparse(final_url).scheme != "https" or
            urlparse(final_url).netloc != "tormt.folk.ntnu.no" or
            urlparse(final_url).path != path):
            raise ValueError("Unexpected redirect from public NTNU staging")
        status = getattr(response, "status", 200)
        if status != 200:
            raise ValueError(f"HTTP {status}")
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("Public index/asset is larger than smoke-test limit")
        return data


def verify(*, commit: str | None = None, fetcher=urllib.request.urlopen) -> dict:
    if commit is not None and not re.fullmatch(r"[a-f0-9]{40}", commit):
        raise ValueError("Expected commit must be a 40-character SHA-1 Git hash")
    report = {"origin": ORIGIN, "scope": "staging-read-only",
              "paths": {}, "issues": []}
    for path in PATHS:
        try:
            data = fetch_public(path, fetcher=fetcher)
            report["paths"][path] = {"ok": True, "bytes": len(data)}
            if path == "/v2-staging/build.txt":
                build = data.decode("utf-8", errors="strict").strip()
                report["build"] = build
                if not re.fullmatch(r"[a-f0-9]{40}", build):
                    raise ValueError("Invalid deployment build marker")
                if commit is not None and build != commit:
                    raise ValueError("Live staging build does not match requested Git commit")
            if path.endswith("/index.json"):
                body = json.loads(data)
                if not isinstance(body, dict):
                    raise ValueError("Semester index is not a JSON object")
                # No protected resource names are printed in this report.
                report["paths"][path]["records"] = len(body)
            if path.endswith("/src/app.js") and b"loadContent" not in data:
                raise ValueError("Missing V2 application entrypoint")
            if path.endswith("/src/courses/ntnu-catalog.js") and b"loadNTNUCatalog" not in data:
                raise ValueError("Missing NTNU same-origin catalog")
            if path.endswith("/scripts/fusion_export_folknet.py") and b"adsk.fusion" not in data:
                raise ValueError("Missing local Fusion helper")
        except (urllib.error.URLError, OSError, UnicodeError, ValueError,
                json.JSONDecodeError) as error:
            report["paths"][path] = {"ok": False}
            report["issues"].append({"path": path, "error": str(error)[:150]})
    report["ready"] = not report["issues"]
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--commit", help="Expected, freshly deployed main Git SHA")
    args = parser.parse_args()
    report = verify(commit=args.commit)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print("WARNING: HTTP checks do NOT prove OAuth, protected-file access, or JS behavior.")
    return 0 if report["ready"] else 1


if __name__ == "__main__":
    sys.exit(main())
