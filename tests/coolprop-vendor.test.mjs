import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";

test("CoolProp WASM is a pinned, self-contained V2 repository asset",()=>{
  const wasm=readFileSync(new URL("../src/vendor/coolprop/coolprop.wasm",import.meta.url));
  assert.equal(wasm.byteLength,4175872);
  assert.equal(wasm.subarray(0,4).toString("hex"),"0061736d");
  const sha=createHash("sha1")
    .update(Buffer.from(`blob ${wasm.byteLength}\0`))
    .update(wasm).digest("hex");
  assert.equal(sha,"db4c724c417c9614a600c5105946be1605a02106");
});
