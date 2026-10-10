#!/usr/bin/env python3
"""Build a LOCAL NTNU candidate package, never upload or change V1.

Use reviewed public course files from outside Git. No private content, password
files, or server secrets may enter the candidate. The separate authenticated
private course area is an operator-managed NTNU Apache directory.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path, PurePosixPath

import build_preview
from audit_public_assets import resource_violations, validate_manifest

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / ".deploy-ntnu-staging"
PUBLIC_COURSE_PREFIX = "site-content/semesters/"
SERVICE_CONFIG_PATH = "data/service-endpoints.json"
MATPRIS_TARGET = "includes/matpris/api.php"
SAFE_SUFFIXES = {".pdf", ".txt", ".md", ".html", ".htm", ".csv", ".json",
                 ".ipynb", ".tex", ".py", ".js", ".xml", ".yaml", ".yml",
                 ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".docx",
                 ".xlsx", ".pptx", ".mp4", ".webm", ".stl", ".3mf", ".obj",
                 ".glb", ".gltf", ".f3d", ".f3z", ".step", ".stp", ".iges",
                 ".igs", ".z012rs", ".z014rs", ".z12", ".z14", ".w10",
                 ".vault"}  # suffix allowlist is a second guard, not permissions

def resource_relative_path(value: str) -> Path | None:
    raw = str(value or "").strip()
    if raw.startswith("https://"):
        return None  # approved external link metadata, not an asset to copy
    if not raw.startswith("./"):
        raise ValueError("Course asset must use a ./site-content/semesters/ path or HTTPS link")
    name = raw[2:]
    posix = PurePosixPath(name)
    if (not name.startswith(PUBLIC_COURSE_PREFIX) or
        any(p in {"", ".", ".."} or p.startswith(".") for p in posix.parts) or
        "\\" in name or "?" in name or "#" in name):
        raise ValueError("Untrusted or non-public course asset path")
    if resource_violations(name):
        raise ValueError("Protected or credential-like course asset path")
    if posix.suffix.casefold() not in SAFE_SUFFIXES and not name.endswith(".vault.json"):
        raise ValueError("Unknown course asset type needs explicit review: " + posix.suffix)
    return Path(*posix.parts)

def approved_files(manifest: dict, approved_root: Path) -> list[tuple[Path, Path]]:
    if not isinstance(manifest, dict) or not isinstance(manifest.get("semesters"), list):
        raise ValueError("Expected a complete JSON course manifest")
    if str(manifest.get("source") or "").removeprefix("./") != "site-content/semesters":
        raise ValueError("Expected the reviewed site-content/semesters source, not demo fixtures")
    issues = validate_manifest(manifest)
    if issues:
        raise ValueError("Protected resources present in approved public manifest")
    root = approved_root.resolve(strict=True)
    pairs, seen = [], set()
    for semester in manifest["semesters"]:
        for course in semester.get("courses", []):
            for resource in course.get("resources", []):
                relative = resource_relative_path(resource.get("path") or resource.get("url"))
                if relative is None:
                    continue
                if relative in seen:
                    continue
                seen.add(relative)
                source = root / relative
                if (not source.is_file() or source.is_symlink() or
                    not source.resolve().is_relative_to(root)):
                    raise ValueError("Missing, symlinked or outside-root public course file: " + str(relative))
                # Deny symlink directory traversal even when it resolves inside root.
                current = root
                for part in relative.parts:
                    current = current / part
                    if current.is_symlink():
                        raise ValueError("Symlink course-directory path is not approved")
                pairs.append((source, relative))
    return pairs

def validate_output(output: Path) -> None:
    output = output.absolute()
    if output.is_symlink() or output == ROOT or ROOT.is_relative_to(output):
        raise ValueError("Unsafe destination")
    if any(output == ROOT / name or output.is_relative_to(ROOT / name)
           for name in build_preview.COPY_DIRS):
        raise ValueError("Cannot stage inside a public source directory")
    if output.exists() and (
        not output.is_dir() or
        (any(output.iterdir()) and not (output / "build.txt").is_file())
    ):
        raise ValueError("Will not replace unmarked existing directory")

def build_ntnu_staging(
    version: str,
    output: Path,
    manifest_path: Path | None = None,
    approved_root: Path | None = None,
    enable_matpris: bool = False,
) -> dict:
    if (manifest_path is None) != (approved_root is None):
        raise ValueError("--manifest and --approved-root are required together")
    output = output.absolute()
    validate_output(output)

    manifest, files = None, []
    if manifest_path is not None:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        files = approved_files(manifest, approved_root)
        if not files:
            raise ValueError("The approved public manifest has no local course files")

    output.parent.mkdir(parents=True, exist_ok=True)
    # Build, audit and validate the complete candidate before replacing anything.
    with tempfile.TemporaryDirectory(prefix=".ntnu-build-", dir=output.parent) as temp:
        stage = Path(temp) / "site"
        build_preview.build(version, stage)
        if manifest is not None:
            for source, relative in files:
                target = stage / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
            (stage / "data" / "content-manifest.json").write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        services = {"matpris": {"enabled": False, "endpoint": None}}
        if enable_matpris:
            endpoint = stage / MATPRIS_TARGET
            endpoint.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / "server" / "matpris.php", endpoint)
            services["matpris"] = {"enabled": True, "endpoint": "./" + MATPRIS_TARGET}
        (stage / SERVICE_CONFIG_PATH).write_text(
            json.dumps(services, indent=2) + "\n", encoding="utf-8")

        # Re-audit the actual staged files including any local course additions.
        from audit_public_assets import validate_sources
        problems = validate_sources([stage])
        if problems:
            raise ValueError("Staged public asset rejected: " + str(problems[0]))
        for _,relative in files:
            if not (stage / relative).is_file():
                raise ValueError("An approved resource is missing from the candidate")
        # No .htaccess/private course directory is auto-generated in the public tree:
        # NTNU authentication rules require separate owner review.
        previous = None
        if output.exists():
            previous = Path(temp) / "old"
            output.rename(previous)
        try:
            stage.rename(output)
        except Exception:
            if previous is not None and previous.exists():
                previous.rename(output)
            raise
    return {"output": str(output), "version": version,
            "publicCourseFiles": len(files), "matprisPhpBundled": enable_matpris}

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", required=True)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--manifest", type=Path,
                        help="Locally reviewed public course manifest (NOT the live V1 index)")
    parser.add_argument("--approved-root", type=Path,
                        help="Local approved public resource root holding site-content/semesters/")
    parser.add_argument("--enable-matpris", action="store_true",
                        help="Bundle PHP proxy and explicitly enable it in generated public config")
    args = parser.parse_args()
    report = build_ntnu_staging(args.version, args.output, args.manifest,
                                args.approved_root, args.enable_matpris)
    print(json.dumps(report, indent=2))
    print("Local staging ONLY. Nothing deployed, no private files or API keys copied.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
