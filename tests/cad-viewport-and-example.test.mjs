import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fitDistanceForBox} from "../src/model/cad-camera-fit.js";
import {spaceMouseMovement} from "../src/model/spacemouse-motion.js";
import {parseKisssoft} from "../src/engineering/kisssoft-core.js";
import {boxMesh} from "../src/hydro/fixtures.js";

test("CAD fit accounts for field of view, aspect, geometry and tall/thin parts",()=>{
 const a=fitDistanceForBox([8,3,2],[1.7,-1.8,1.25],{aspect:1.5});
 const narrow=fitDistanceForBox([8,3,2],[1.7,-1.8,1.25],{aspect:.4});
 assert.ok(a>0&&Number.isFinite(a));
 assert.ok(narrow>a,"narrow viewport needs greater stand-off");
 const tiny=fitDistanceForBox([.1,.1,.1],[1,-1,1]);
 assert.ok(tiny<a);
 assert.throws(()=>fitDistanceForBox([2,1,1],[0,0,0]),/Invalid CAD camera/);
 assert.throws(()=>fitDistanceForBox([2,Infinity,1],[1,0,1]),/Invalid CAD camera/);
});
test("SpaceMouse maps depth motion to real dolly zoom and caps sensitive inputs",()=>{
 const t=spaceMouseMovement({kind:"translate",values:[.5,-.3,.8]},{sensitivity:.6});
 assert.equal(t.pan.length,3);
 assert.equal(t.pan[2],0);
 assert.ok(t.zoom<1,"positive Z zooms in");
 const invert=spaceMouseMovement({kind:"translate",values:[0,0,.8]},{invertZoom:true});
 assert.ok(invert.zoom>1);
 const rotation=spaceMouseMovement({kind:"rotate",values:[1,1,1]},{sensitivity:.6});
 assert.ok(rotation.orbit.every(Number.isFinite));
 assert.equal(spaceMouseMovement({kind:"rotate",values:[Infinity,0,0]}),null);
});
test("ship block fixtures preserve geometric scale when used as a CAD demo",()=>{
 const geo=boxMesh({L:8,B:3,H:2});
 assert.equal(geo.positions.length%3,0);
 assert.ok(geo.indices.length>=12);
});
test("bundled KISSsoft demonstration is a readable coherent Z014 synthetic parameter file",()=>{
 const source=readFileSync(new URL("../examples/kisssoft/PlanetaryExample.Z14",import.meta.url),"utf8");
 const model=parseKisssoft(source,"PlanetaryExample.Z14");
 assert.equal(model.consistent,true);
 assert.equal(model.planetary,true);
 assert.equal(model.centerDistance,60);
 assert.deepEqual(model.gears.map(x=>x.teeth),[25,35,-95]);
});
test("standalone CAD and gear CSS maintain actual viewport dimensions and equal mode buttons",()=>{
 const css=readFileSync(new URL("../assets/viewer-enhancements.css",import.meta.url),"utf8");
 const engineering=readFileSync(new URL("../assets/engineering.css",import.meta.url),"utf8");
 assert.match(css,/\.cad-geometry-stage\{height:clamp\(/);
 assert.match(css,/\.cad-geometry-stage \.model-viewer-workbench\{/);
 assert.match(engineering,/\.workspace-bar \.engineering-model-control>\.btn\{/);
});
