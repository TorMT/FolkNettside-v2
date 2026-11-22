import test from "node:test";
import assert from "node:assert/strict";
import {remoteViewerErrorMessage} from "../src/viewers/remote-error-message.js";

test("NTNU preview errors explain missing files, access control and CORS separately",()=>{
  for(const status of [404,410])
    assert.match(remoteViewerErrorMessage(Error(`HTTP ${status} while loading file preview.`)),/ikke funnet/);
  for(const status of [401,403])
    assert.match(remoteViewerErrorMessage(Error(`HTTP ${status} while loading file preview.`)),/krever tilgang/);
  assert.match(remoteViewerErrorMessage(new TypeError("Failed to fetch")),/CORS/);
  assert.match(remoteViewerErrorMessage(Error("HTTP 500 while loading file preview.")),/CORS/);
  assert.match(remoteViewerErrorMessage(null),/CORS/);
  // "HTTP 4040" is not a 404.
  assert.match(remoteViewerErrorMessage(Error("HTTP 4040")),/CORS/);
});

test("the raw error text never reaches the message",()=>{
  const message=remoteViewerErrorMessage(Error("HTTP 403 https://tormt.folk.ntnu.no/semestre/x.py?token=secret"));
  assert.doesNotMatch(message,/token|secret|semestre|https?:/);
});
