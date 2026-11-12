#!/usr/bin/env python3
"""Import ONLY the public Google OAuth browser client ID from the frozen V1 site.

Never migrate Brewfather/RAPT/APS credentials or private folders over HTTP.
This one-time operator command does not alter V1 or automatically publish data.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

LEGACY_URL = "https://tormt.folk.ntnu.no/includes/brewing/api/storage.php"
MAX_RESPONSE_BYTES = 65536
CLIENT_ID = re.compile(r"^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$")


class ImportErrorSafe(ValueError):
    """Configuration not usable; avoid including untrusted server responses."""


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ImportErrorSafe("Legacy endpoint redirected; import cancelled.")


def public_google_config_from_legacy(payload: object) -> dict:
    """Allowlist one non-secret browser identifier, ignoring ALL other fields."""
    if not isinstance(payload, dict):
        raise ImportErrorSafe("Legacy response is not a JSON object.")
    google = payload.get("googleDriveAuth")
    if not isinstance(google, dict):
        raise ImportErrorSafe("Legacy public Google configuration not found.")
    client_id = google.get("clientId")
    if not isinstance(client_id, str) or not CLIENT_ID.fullmatch(client_id):
        raise ImportErrorSafe("Legacy browser client ID missing or invalid.")
    if google.get("enabled") is not True:
        raise ImportErrorSafe("Legacy Google configuration is disabled.")
    # No tokens, project data, API keys, folder IDs or arbitrary scopes survive.
    return {"googleDriveAuth": {"clientId": client_id}}


def fetch_public_config(url: str = LEGACY_URL, opener=None) -> dict:
    if url != LEGACY_URL:
        raise ImportErrorSafe("Only the fixed, reviewed legacy endpoint is allowed.")
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname != "tormt.folk.ntnu.no":
        raise ImportErrorSafe("Legacy source must use the exact verified HTTPS origin.")
    client = opener or build_opener(NoRedirects())
    try:
        response = client.open(
            Request(url, headers={"Accept": "application/json", "User-Agent": "FolkV2-public-config-import/1"}),
            timeout=12,
        )
        with response:
            if response.getcode() != 200:
                raise ImportErrorSafe("Legacy endpoint did not return HTTP 200.")
            content_type = response.headers.get("Content-Type", "").lower()
            if "application/json" not in content_type:
                raise ImportErrorSafe("Legacy endpoint did not return JSON.")
            body = response.read(MAX_RESPONSE_BYTES + 1)
            if len(body) > MAX_RESPONSE_BYTES:
                raise ImportErrorSafe("Legacy response exceeds the size limit.")
        payload = json.loads(body.decode("utf-8"))
    except ImportErrorSafe:
        raise
    except (OSError, ValueError, UnicodeError) as exc:
        # Never include the response body, headers, or remote error text.
        raise ImportErrorSafe("Unable to retrieve valid public legacy configuration.") from exc
    return public_google_config_from_legacy(payload)


def save_new_config(target: Path, data: dict) -> None:
    if target.exists():
        raise ImportErrorSafe("Destination already exists; refusing to overwrite.")
    if not target.parent.is_dir():
        raise ImportErrorSafe("Destination directory does not exist.")
    # Exclusive create. A failed import never overwrites an existing V2 setup.
    with target.open("x", encoding="utf-8") as fp:
        json.dump(data, fp, indent=2, ensure_ascii=False)
        fp.write("\n")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write", action="store_true",
        help="Create V2 data/google-auth.json with only the public browser client ID",
    )
    args = parser.parse_args(argv)
    try:
        config = fetch_public_config()
        if args.write:
            destination = Path(__file__).resolve().parents[1] / "data" / "google-auth.json"
            save_new_config(destination, config)
            print("Created V2 public Google browser config (no secret values copied).")
        else:
            print("Public Google browser configuration detected. Dry run only.")
            print("Run with --write to create data/google-auth.json after reviewing OAuth origins.")
        return 0
    except ImportErrorSafe as exc:
        print("Import unavailable: " + str(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
