import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("Leaving MedisinTimer disposes its returned cleanup object without breaking navigation",()=>{
 const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
 const medisin=readFileSync(new URL("../src/diverse/medisin-page.js",import.meta.url),"utf8");
 assert.match(medisin,/return \{cleanup\(\)\{/);
 assert.match(app,/if\(path!=="\/diverse\/medisin"\)\{medisinCleanup\?\.cleanup\?\.\(\);medisinCleanup=null;\}/);
 assert.doesNotMatch(app,/medisinCleanup\?\.\(\)/);
});
