#!/usr/bin/env python3
"""Add a manually reviewed LinkedIn update to the public CV feed.

Usage:
  python scripts/add_cv_update.py --url https://www.linkedin.com/posts/... --title "New design" --text "Short public summary" --date 2026-10-08
"""
import argparse
import json
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CV = ROOT / "data" / "cv.json"

def validate_url(raw):
    parsed = urlparse(raw)
    if parsed.scheme != "https" or parsed.hostname not in {"linkedin.com", "www.linkedin.com"}:
        raise ValueError("Expected an HTTPS linkedin.com URL")
    if not parsed.path.strip("/"):
        raise ValueError("Expected a LinkedIn post or article URL, not the homepage")
    return raw

def add_update(cv, *, url, title, text, date_string):
    if not isinstance(cv.get("updates"), list):
        raise ValueError("CV 'updates' must be a list")
    url = validate_url(url)
    day = date.fromisoformat(date_string)
    if not title.strip() or not text.strip():
        raise ValueError("Title and text are required")
    if any(row.get("url") == url for row in cv["updates"]):
        raise ValueError("This LinkedIn URL is already in the CV feed")
    cv["updates"].insert(0, {
        "id": "linkedin-" + day.isoformat() + "-" + str(len(cv["updates"]) + 1),
        "title": title.strip(),
        "period": day.isoformat(),
        "description": text.strip(),
        "url": url
    })
    return cv

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--text", required=True)
    parser.add_argument("--date", default=date.today().isoformat())
    args = parser.parse_args()
    current = json.loads(CV.read_text(encoding="utf-8"))
    updated = add_update(current, url=args.url, title=args.title, text=args.text, date_string=args.date)
    CV.write_text(json.dumps(updated, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Added LinkedIn update. Review data/cv.json and commit it to publish.")

if __name__ == "__main__":
    main()
