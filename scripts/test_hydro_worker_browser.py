#!/usr/bin/env python3
"""Dependency-free W3C WebDriver status-wait for asynchronous browser smoke tests."""
import json
import sys
import time
import urllib.error
import urllib.request

DRIVER = "http://127.0.0.1:9515"

def call(method, path, body=None, timeout=30):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(DRIVER + path, data=data, method=method,
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        payload=json.load(response)
    if isinstance(payload.get("value"), dict) and payload["value"].get("error"):
        raise RuntimeError(str(payload["value"]))
    return payload.get("value")

def main(url):
    session=None
    try:
        for _ in range(90):
            try:
                call("GET","/status",timeout=1)
                break
            except Exception:time.sleep(.15)
        else:raise RuntimeError("ChromeDriver did not start")
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

if __name__=="__main__":
    try:sys.exit(main(sys.argv[1]))
    except Exception as e:
        print(str(e),file=sys.stderr)
        sys.exit(1)
