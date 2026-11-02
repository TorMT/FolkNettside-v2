import test from "node:test";
import assert from "node:assert/strict";
import {viewerHelpContent,viewerHelpHTML} from "../src/viewers/viewer-help.js";

test("viewer guidance reflects supported format and distinct limitations",()=>{
  const pdf=viewerHelpContent("pdf");
  assert.match(pdf.can,/PDF-sider/);
  assert.match(pdf.limit,/mobil/);
  assert.match(viewerHelpContent("python").limit,/pakker/);
  assert.match(viewerHelpContent("kisssoft").limit,/ISO 6336/);
  assert.match(viewerHelpContent("office").limit,/makroer/);
  assert.match(viewerHelpContent("unsupported").can,/originalfil/);
  assert.deepEqual(viewerHelpContent("bogus"),viewerHelpContent("unsupported"));
});

test("help content derives only from the fixed format map, not untrusted metadata",()=>{
  const untrusted="<img src=x onerror=alert(1)>";
  const html=viewerHelpHTML({kind:"FILE",name:untrusted,path:"./notes.pdf",label:untrusted});
  assert.match(html,/Hjelp med filvisning/);
  assert.match(html,/Open original/);
  assert.match(html,/Åpne nedlastet fil/);
  assert.doesNotMatch(html,/<img|onerror|alert\(1\)/);
  assert.match(html,/<dialog[^>]*aria-labelledby=/);
});

test("unsupported files receive actionable fallback and no false promise",()=>{
  const html=viewerHelpHTML({kind:"FILE",path:"/download/data.7z"});
  assert.match(html,/ingen sikker innebygd forhåndsvisning/);
  assert.match(html,/originalfilen/);
});
