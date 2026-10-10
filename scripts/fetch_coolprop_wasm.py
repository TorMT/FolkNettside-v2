#!/usr/bin/env python3
"""Verify the pinned vendored CoolProp WASM without network requests."""

from __future__ import annotations

import hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"src/vendor/coolprop/coolprop.wasm"
EXPECTED_SIZE=4175872
EXPECTED_GIT_BLOB_SHA1="db4c724c417c9614a600c5105946be1605a02106"

def git_blob_sha1(data: bytes) -> str:
    header=f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header+data).hexdigest()

def verify_vendored(path: Path = OUTPUT) -> dict:
    """Verify the vendored binary; never fetch from the legacy NTNU site."""
    if not path.is_file():
        raise FileNotFoundError(
            f"Missing vendored CoolProp WASM: {path}. "
            "The build must not depend on the old NTNU production site."
        )
    data = path.read_bytes()
    if len(data) != EXPECTED_SIZE:
        raise ValueError(f"CoolProp WASM size mismatch: {len(data)} != {EXPECTED_SIZE}")
    if data[:4] != b"\x00asm":
        raise ValueError("CoolProp WASM magic invalid")
    actual = git_blob_sha1(data)
    if actual != EXPECTED_GIT_BLOB_SHA1:
        raise ValueError(f"CoolProp WASM pinned Git blob mismatch: {actual}")
    return {"size": len(data), "git_blob_sha1": actual, "sha256": hashlib.sha256(data).hexdigest()}


def main() -> int:
    result = verify_vendored()
    print(f"Local vendored CoolProp WASM verified: {result}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
