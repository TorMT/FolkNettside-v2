import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseOBJ} from "../src/model/parsers/obj.js";
import {applyModelRules} from "../src/model/load-model.js";
import {ASV_MODEL} from "../src/engineering/asv-model.js";
import {createHydroInclude} from "../src/hydro/hydro-selection.js";
import {analysisCapability} from "../src/engineering/capabilities.js";

test("ASV direct-load source is real checked-in simplified OBJ, never implied original CAD",()=>{
  const raw=readFileSync(new URL("../examples/models/asv-tollak-visual-preview.obj",import.meta.url));
  const doc=applyModelRules(parseOBJ(raw,"ASV Tollak",{unit:"millimeter"}),ASV_MODEL.componentRules);
  assert.ok(doc.components.length>=2);
  assert.ok(doc.components.every(c=>c.geometry.indices.length>=3));
  assert.ok(doc.components.every(c=>c.geometry.positions.every(Number.isFinite)));
  assert.equal(doc.unitScaleToMeters,.001);
  assert.equal(analysisCapability(ASV_MODEL,"model").enabled,true);
  assert.equal(analysisCapability(ASV_MODEL,"hydro").enabled,false);
  assert.equal(doc.components.filter(createHydroInclude(doc)).length,0,
    "The simplified OBJ must never enter the real Hydro numeric solver");
  assert.match(ASV_MODEL.source.notes,/not published/i);
});
test("ASV catalog and CAD entry points load the existing file without user import",()=>{
  const content=readFileSync(new URL("../src/content.js",import.meta.url),"utf8");
  const cad=readFileSync(new URL("../src/engineering/cad-tool.js",import.meta.url),"utf8");
  const loading=readFileSync(new URL("../src/model/load-model.js",import.meta.url),"utf8");
  assert.match(content,/ASV_MODEL/);
  assert.match(cad,/data-cad-asv-preview/);
  assert.match(cad,/loadModelDocument\(ASV_MODEL\)/);
  assert.match(cad,/asv-hydro\.html/);
  assert.match(loading,/parseOBJ/);
});
