import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {remoteReadOnlyFallbackURL} from "../src/viewers/remote-readonly-fallback.js";

const base={
  source:"ntnu",remoteArchive:true,
  url:"https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/%C3%98ving1/code.py"
};
test("real approved NTNU code paths get a constrained raw-file fallback",()=>{
  assert.equal(remoteReadOnlyFallbackURL(base,"python"),base.url);
  assert.equal(remoteReadOnlyFallbackURL({
    ...base,url:base.url.replace("code.py","notebook.ipynb")
  },"notebook"),base.url.replace("code.py","notebook.ipynb"));
  assert.equal(remoteReadOnlyFallbackURL({
    ...base,url:base.url.replace("code.py","data.csv")
  },"csv"),base.url.replace("code.py","data.csv"));
});

test("no cross-origin, credentials, protocol downgrade or unapproved URLs",()=>{
  for(const url of [
    "http://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/x.py",
    "https://tormt.folk.ntnu.no.evil.example/semestre/5/Marin-Dynamikk/filer/x.py",
    "https://user:pass@tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/x.py",
    base.url+"?query=1",
    base.url+"#fragment",
    "https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/%2E%2E/private.py",
    "https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/%2fsecret.py",
    "https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/private/notes.py",
    "https://tormt.folk.ntnu.no/semestre/5/Marin-Dynamikk/filer/secret.py"
  ])assert.equal(remoteReadOnlyFallbackURL({...base,url},"python"),null,url);
  assert.equal(remoteReadOnlyFallbackURL({...base,source:"external"},"python"),null);
  assert.equal(remoteReadOnlyFallbackURL({...base,remoteArchive:false},"python"),null);
});

test("unsupported types and interactive HTML never render in the fallback",()=>{
  for(const kind of ["html","pdf","office","fusion","cad","gltf","video","quiz"]){
    assert.equal(remoteReadOnlyFallbackURL(base,kind),null,kind);
  }
  assert.equal(remoteReadOnlyFallbackURL({...base,
    url:base.url.replace("code.py","script.html")},"text"),null);
});

test("viewer catch uses sandboxed iframe without script permissions or inline user HTML",()=>{
  const code=readFileSync(new URL("../src/viewers/viewer-shell.js",import.meta.url),"utf8");
  assert.match(code,/remoteReadOnlyFallbackURL\(resource,viewerKind\(resource\)\)/);
  assert.match(code,/sandbox="" referrerpolicy="no-referrer"/);
  assert.match(code,/escapeHTML\(publicOriginal\)/);
  assert.match(code,/Åpne originalfil på NTNU/);
  assert.match(code,/viewer-error-original/,"Keep direct-original fallback for all other errors.");
});
