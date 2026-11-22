#!/usr/bin/env python3
"""Dependency-free W3C WebDriver status-wait for asynchronous browser smoke tests."""
import json
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

DRIVER_PORT = "9515"
DRIVER = "http://127.0.0.1:" + DRIVER_PORT

def call(method, path, body=None, timeout=30):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(DRIVER + path, data=data, method=method,
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        payload=json.load(response)
    if isinstance(payload.get("value"), dict) and payload["value"].get("error"):
        raise RuntimeError(str(payload["value"]))
    return payload.get("value")

def start_driver(popen=subprocess.Popen, which=shutil.which):
    """Start a ChromeDriver on the port the smoke tests use. Returns the process or None."""
    binary = which("chromedriver")
    if not binary:
        return None
    return popen([binary, "--port=" + DRIVER_PORT, "--allowed-ips=127.0.0.1"],
                 stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def wait_for_driver(seconds=30, request=call, sleep=time.sleep, clock=time.monotonic,
                    restart=None, restart_after=4, max_restarts=3):
    """Wait for startup under a wall-clock bound; do not retry actual smoke failures.

    The workflows start ChromeDriver in the background right after the previous step killed
    its own on the same port. When the old one has not released the port yet, the new one
    exits at once and nothing ever listens: the wait then ran out its 30 s and failed the
    job. If `restart` is given and nothing has answered for `restart_after` seconds, it is
    called (at most `max_restarts` times) to start a driver now that the port is free.
    A driver that answers but is not ready is never restarted.
    """
    start = clock()
    deadline = start + seconds
    last_error = None
    restarts = 0
    last_contact = start
    while clock() < deadline:
        try:
            status = request("GET", "/status", timeout=1)
            if isinstance(status, dict) and status.get("ready") is True:
                return
            last_error = "ChromeDriver running but not ready"
            last_contact = clock()
        except (OSError, TimeoutError, urllib.error.URLError) as error:
            last_error = type(error).__name__
            if restart and restarts < max_restarts and clock() - last_contact >= restart_after:
                restarts += 1
                last_contact = clock()
                restart()
        sleep(min(0.25, max(0, deadline - clock())))
    detail = str(last_error or "unknown")
    if restarts:
        detail += ", restarted %d time(s)" % restarts
    raise RuntimeError("ChromeDriver did not start within " + str(seconds) + "s (" + detail + ")")


def main(url):
    session=None
    owned=[]
    def restart():
        process=start_driver()
        if process:
            owned.append(process)
            print("ChromeDriver was not listening: started one for this smoke test",file=sys.stderr)
    try:
        wait_for_driver(restart=restart)
        window_size=sys.argv[3] if len(sys.argv)>3 else "800,600"
        response=call("POST","/session",{"capabilities":{"alwaysMatch":{
            "browserName":"chrome",
            "goog:chromeOptions":{"args":["--headless=new","--no-sandbox",
                "--disable-gpu","--disable-dev-shm-usage","--window-size="+window_size]}
        }}},timeout=35)
        session=response.get("sessionId")
        if not session:raise RuntimeError("ChromeDriver did not return a session ID")
        call("POST",f"/session/{session}/url",{"url":url},timeout=30)
        deadline=time.monotonic()+int(sys.argv[2]) if len(sys.argv)>2 else time.monotonic()+30
        latest=None
        while time.monotonic()<deadline:
            latest=call("POST",f"/session/{session}/execute/sync",{
                "script":"""return {
                    status:document.body.dataset.status,
                    phase:document.body.dataset.phase,
                    detail:document.querySelector('#result')?.textContent||''
                }""",
                "args":[]
            })
            if latest.get("status")=="pass":
                print("Browser smoke PASSED:",json.dumps(latest))
                return 0
            if latest.get("status")=="fail":
                raise RuntimeError("Browser smoke FAILED: "+json.dumps(latest))
            time.sleep(.25)
        raise RuntimeError("Browser smoke timed out: "+json.dumps(latest))
    finally:
        if session:
            try:call("DELETE",f"/session/{session}")
            except Exception:pass
        for process in owned:
            try:
                process.terminate()
                process.wait(timeout=5)
            except Exception:
                try:process.kill()
                except Exception:pass

if __name__=="__main__":
    try:sys.exit(main(sys.argv[1]))
    except Exception as e:
        print(str(e),file=sys.stderr)
        sys.exit(1)
