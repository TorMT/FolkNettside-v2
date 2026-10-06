#!/usr/bin/env python3
"""Fetch the legacy CoolProp WebAssembly binary for the v2 Pages build.

The binary is downloaded at build time from the existing public Folk deployment,
then validated against the exact Git blob id from the legacy repository.
"""

from __future__ import annotations

import hashlib
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
URL="https://tormt.folk.ntnu.no/Tools/Coolprop/coolprop.wasm"
OUTPUT=ROOT/"src/vendor/coolprop/coolprop.wasm"
EXPECTED_SIZE=4175872
EXPECTED_GIT_BLOB_SHA1="db4c724c417c9614a600c5105946be1605a02106"

def git_blob_sha1(data: bytes) -> str:
    header=f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header+data).hexdigest()

def main() -> int:
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    request=urllib.request.Request(URL,headers={"User-Agent":"FolkNettside-v2-build/1"})
    with urllib.request.urlopen(request,timeout=60) as response:
        data=response.read()

    if len(data)!=EXPECTED_SIZE:
        raise SystemExit(f"CoolProp WASM size mismatch: {len(data)} != {EXPECTED_SIZE}")
    if data[:4]!=b"\x00asm":
        raise SystemExit("CoolProp download is not a WebAssembly binary")
    actual=git_blob_sha1(data)
    sha256=hashlib.sha256(data).hexdigest()
    print(f"Downloaded CoolProp WASM: {len(data)} bytes; git blob {actual}; sha256 {sha256}")
    if actual!=EXPECTED_GIT_BLOB_SHA1:
        raise SystemExit(f"CoolProp Git blob SHA mismatch: {actual}")

    OUTPUT.write_bytes(data)
    print(f"CoolProp WASM verified: {len(data)} bytes, git blob {actual}")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
