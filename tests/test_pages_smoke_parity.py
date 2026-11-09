"""Pull-request checks must gate the same browser smokes as the Pages deploy.

Regression for the outage after #192: pages.yml ran a Settings browser smoke
that pr-checks.yml never ran, so a green PR broke every later deploy.
"""
import contextlib
import importlib.util
import io
import re
import tempfile
import textwrap
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location(
    "run_pages_workflow_smokes", ROOT / "scripts" / "run_pages_workflow_smokes.py")
runner = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(runner)

SMOKE_PAGE = re.compile(r"tests/browser/[A-Za-z0-9_-]+\.html")


def pages_in(text):
    return set(SMOKE_PAGE.findall(text))


def run_main(argv, cwd):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = runner.main(argv, cwd=cwd)
    return code, out.getvalue(), err.getvalue()


@unittest.skipIf(runner.yaml is None, "PyYAML is required for workflow parsing")
class PagesSmokeParityTests(unittest.TestCase):
    def test_default_steps_exist_in_pages_workflow_and_are_runnable(self):
        steps = runner.load_steps(ROOT / ".github/workflows/pages.yml")
        for name in runner.DEFAULT_STEPS:
            self.assertIn(name, steps, "renamed or removed Pages step: " + name)
            runner.check_runnable(name, steps[name])

    def test_every_pages_smoke_page_is_also_gated_on_pull_requests(self):
        steps = runner.load_steps(ROOT / ".github/workflows/pages.yml")
        pages_text = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
        pr_text = (ROOT / ".github/workflows/pr-checks.yml").read_text(encoding="utf-8")
        covered_by_runner = set()
        for name in runner.DEFAULT_STEPS:
            covered_by_runner |= pages_in(steps[name]["run"])
        missing = pages_in(pages_text) - pages_in(pr_text) - covered_by_runner
        self.assertEqual(
            set(), missing,
            "Pages deploy runs these browser smokes but pull requests do not: "
            + ", ".join(sorted(missing))
            + ". Add the step to DEFAULT_STEPS in scripts/run_pages_workflow_smokes.py.")

    def _workflow(self, directory, body):
        path = Path(directory) / "wf.yml"
        path.write_text(textwrap.dedent(body), encoding="utf-8")
        return path

    def test_runner_runs_every_step_and_fails_when_one_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._workflow(tmp, """\
                jobs:
                  j:
                    steps:
                      - name: good
                        run: echo fine
                      - name: bad
                        run: |
                          echo boom
                          exit 3
                      - name: after
                        run: touch ran-after
                """)
            code, out, _ = run_main(["--workflow", "wf.yml", "good", "bad", "after"], Path(tmp))
            self.assertEqual(1, code)
            self.assertTrue((Path(tmp) / "ran-after").exists(), "later steps must still run")
            self.assertIn("PASS  good", out)
            self.assertIn("FAIL  bad", out)
            self.assertIn("boom", out)
            self.assertIn("FAILED: bad", out)

    def test_runner_uses_bash_errexit_like_github_actions(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._workflow(tmp, """\
                jobs:
                  j:
                    steps:
                      - name: stops early
                        run: |
                          false
                          touch should-not-exist
                """)
            code, _, _ = run_main(["--workflow", "wf.yml", "stops early"], Path(tmp))
            self.assertEqual(1, code)
            self.assertFalse((Path(tmp) / "should-not-exist").exists())

    def test_unknown_or_context_dependent_steps_stop_before_running_anything(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._workflow(tmp, """\
                jobs:
                  j:
                    steps:
                      - name: first
                        run: touch ran-first
                      - name: uses expression
                        run: echo "${{ github.sha }}"
                      - name: has env
                        env: {A: "1"}
                        run: echo "$A"
                """)
            for argv in (["first", "missing step"], ["first", "uses expression"], ["first", "has env"]):
                code, _, err = run_main(["--workflow", "wf.yml", *argv], Path(tmp))
                self.assertEqual(2, code, argv)
                self.assertIn("error:", err)
            self.assertFalse((Path(tmp) / "ran-first").exists(), "nothing may run after a usage error")

    def test_timeout_is_a_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._workflow(tmp, """\
                jobs:
                  j:
                    steps:
                      - name: hangs
                        run: sleep 30
                """)
            code, out, _ = run_main(["--workflow", "wf.yml", "--timeout", "1", "hangs"], Path(tmp))
            self.assertEqual(1, code)
            self.assertIn("exit 124", out)


if __name__ == "__main__":
    unittest.main()
