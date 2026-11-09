#!/usr/bin/env python3
"""Run the Pages deploy workflow's browser smoke steps before merge.

.github/workflows/pages.yml gates the GitHub Pages deploy on browser smoke
steps that pr-checks.yml did not run, so a pull request could be green and
still break the deploy (docs/ACTIVE_WORK_HANDOFF.md, B21). This script executes
the exact ``run:`` blocks of the selected pages.yml steps, so the two workflows
cannot drift apart. It never deploys anything.

    python scripts/run_pages_workflow_smokes.py            # default set
    python scripts/run_pages_workflow_smokes.py --list
    python scripts/run_pages_workflow_smokes.py "Settings app browser smoke"

Exit status: 0 all selected steps passed, 1 at least one step failed (every
selected step still runs), 2 usage or unsupported-step error (nothing runs).
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
import time
from pathlib import Path

try:
    import yaml
except ImportError:  # reported by main(); keeps --help usable without PyYAML
    yaml = None

DEFAULT_WORKFLOW = Path(".github/workflows/pages.yml")

# Browser smoke steps of pages.yml that pr-checks.yml does not run itself.
DEFAULT_STEPS = (
    "Theme Studio image mode browser smoke",
    "Gunnerus GLB browser smoke",
    "Study workspace browser smoke",
    "Brewing v2 browser smoke",
    "Settings app browser smoke",
    "CoolProp diagram browser smoke",
    "Engineering load sketch browser smoke",
    "Hydro pressure browser smoke",
    "Coupled Hydro Structure girder browser smoke",
    "Structural section YZ sketch browser smoke",
    "Fusion engineering bundle browser smoke",
    "Autodesk Hub read-only navigation browser smoke",
)

# Step keys that would change how a step behaves outside the original job.
UNSUPPORTED_KEYS = ("env", "if", "with", "shell", "working-directory", "uses")


def load_steps(workflow: Path) -> dict[str, dict]:
    """Return the first job's named steps of a workflow file, in file order."""
    if yaml is None:
        raise RuntimeError("PyYAML is required: python -m pip install pyyaml")
    document = yaml.safe_load(Path(workflow).read_text(encoding="utf-8"))
    job = next(iter(document["jobs"].values()))
    return {step["name"]: step for step in job["steps"] if step.get("name")}


def check_runnable(name: str, step: dict) -> None:
    """Reject steps that rely on workflow context this runner cannot supply."""
    script = step.get("run")
    if not isinstance(script, str) or not script.strip():
        raise ValueError(f"step {name!r} has no run: block")
    if "${{" in script:
        raise ValueError(f"step {name!r} uses a workflow expression")
    for key in UNSUPPORTED_KEYS:
        if key in step:
            raise ValueError(f"step {name!r} uses unsupported key {key!r}")


def run_step(script: str, cwd: Path, timeout: int) -> tuple[int, str]:
    """Run one step like GitHub does (bash -e -o pipefail); return rc and log tail."""
    with tempfile.TemporaryFile("w+", encoding="utf-8", errors="replace") as log:
        try:
            completed = subprocess.run(
                ["bash", "-e", "-o", "pipefail", "-c", script],
                cwd=cwd, stdout=log, stderr=subprocess.STDOUT, timeout=timeout,
            )
            code = completed.returncode
        except subprocess.TimeoutExpired:
            code = 124
        log.seek(0)
        lines = log.read().splitlines()
    return code, "\n".join(lines[-80:])


def main(argv: list[str] | None = None, cwd: Path | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("steps", nargs="*", help="step names (default: the standard set)")
    parser.add_argument("--workflow", type=Path, default=DEFAULT_WORKFLOW)
    parser.add_argument("--timeout", type=int, default=600, help="seconds per step")
    parser.add_argument("--list", action="store_true", help="list the default steps and exit")
    args = parser.parse_args(argv)

    if args.list:
        print("\n".join(DEFAULT_STEPS))
        return 0

    base = Path(cwd) if cwd is not None else Path.cwd()
    try:
        available = load_steps(base / args.workflow)  # an absolute --workflow wins
        selected = list(args.steps) or list(DEFAULT_STEPS)
        for name in selected:
            if name not in available:
                raise ValueError(f"step {name!r} not found in {args.workflow}")
            check_runnable(name, available[name])
    except (RuntimeError, ValueError, OSError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2

    failed = []
    for name in selected:
        started = time.monotonic()
        code, tail = run_step(available[name]["run"], base, args.timeout)
        seconds = time.monotonic() - started
        print(f"{'PASS' if code == 0 else 'FAIL'}  {name}  ({seconds:.0f}s)", flush=True)
        if code != 0:
            failed.append(name)
            print(f"::group::{name} output (last lines, exit {code})")
            print(tail)
            print("::endgroup::", flush=True)

    print(f"{len(selected) - len(failed)}/{len(selected)} Pages browser smoke steps passed")
    for name in failed:
        print(f"FAILED: {name}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
