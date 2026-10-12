"""Unit tests for the bounded W3C ChromeDriver readiness handshake."""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "test_hydro_worker_browser", ROOT / "scripts" / "test_hydro_worker_browser.py")
browser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(browser)


class ChromeDriverStartupTests(unittest.TestCase):
    def new_clock(self):
        state = [0.0]
        def now():
            return state[0]
        def sleep(delay):
            self.assertGreaterEqual(delay, 0)
            state[0] += delay
        return now, sleep, state

    def test_transient_startup_failure_then_ready(self):
        now, sleep, state = self.new_clock()
        attempts = []
        def request(method, path, timeout):
            self.assertEqual((method, path, timeout), ("GET", "/status", 1))
            attempts.append(method)
            if len(attempts) <= 3:
                raise OSError("temporarily not bound")
            return {"ready": True}
        browser.wait_for_driver(seconds=2, request=request, clock=now, sleep=sleep)
        self.assertEqual(len(attempts), 4)
        self.assertLess(state[0], 2)

    def test_running_but_not_ready_never_counts_as_success(self):
        now, sleep, state = self.new_clock()
        with self.assertRaisesRegex(RuntimeError, "did not start within 1s"):
            browser.wait_for_driver(seconds=1, request=lambda *args, **kwargs:
                                    {"ready": False}, clock=now, sleep=sleep)
        self.assertEqual(state[0], 1)

    def test_invalid_response_does_not_claim_success(self):
        now, sleep, state = self.new_clock()
        with self.assertRaisesRegex(RuntimeError, "did not start"):
            browser.wait_for_driver(seconds=0.5, request=lambda *args, **kwargs:
                                    None, clock=now, sleep=sleep)

    def test_actual_protocol_errors_fail_fast_not_retried(self):
        now, sleep, state = self.new_clock()
        calls = []
        def request(*args, **kwargs):
            calls.append(1)
            raise RuntimeError("bad W3C status")
        with self.assertRaisesRegex(RuntimeError, "bad W3C"):
            browser.wait_for_driver(seconds=5, request=request, clock=now, sleep=sleep)
        self.assertEqual(len(calls), 1)
        self.assertEqual(state[0], 0)


if __name__ == "__main__":
    unittest.main()
