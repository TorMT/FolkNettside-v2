import test from "node:test";
import assert from "node:assert/strict";
import {replicateCrystal} from "../src/tools/crystal-structures-core.js";
import {
  analyzeCrystal,applyCrystalEdits,bondPairs,bondPlaneCuts,closePackedPlaneSpecs,
  millerPlane,nearestSiteIndex,segmentPlaneIntersection
} from "../src/tools/crystal-analysis.js";

test("bond builder matches the legacy distance-threshold behavior",()=>{
  const sites=[
    {pos:[0,0,0],species:"A"},
    {pos:[1,0,0],species:"A"},
    {pos:[3,0,0],species:"A"}
  ];
  const bonds=bondPairs(sites,1.15);
  assert.equal(bonds.length,1);
  assert.deepEqual([bonds[0].a,bonds[0].b],[0,1]);
});

test("Miller plane keeps legacy normalized normal and representative point",()=>{
  const plane=millerPlane(1,1,0);
  assert.equal(plane.label,"(1 1 0)");
  assert.ok(Math.abs(plane.normal[0]-1/Math.sqrt(2))<1e-12);
  assert.deepEqual(plane.point,[1,1,.5]);
  assert.throws(()=>millerPlane(0,0,0),/cannot all be zero/);
});

test("close-packed families cover the legacy structure groups",()=>{
  assert.equal(closePackedPlaneSpecs("fcc").length,4);
  assert.equal(closePackedPlaneSpecs("bcc").length,6);
  assert.equal(closePackedPlaneSpecs("hcp").length,2);
  assert.equal(closePackedPlaneSpecs("sc").length,3);
});

test("vacancy dopant interstitial and markers are persistent edit operations",()=>{
  const base=[
    {pos:[0,0,0],species:"A"},
    {pos:[1,0,0],species:"A"}
  ];
  const result=applyCrystalEdits(base,[
    {type:"vacancy",baseIndex:0},
    {type:"dopant",baseIndex:1,species:"Cr"},
    {type:"interstitial",pos:[.5,.5,.5],species:"C"},
    {type:"electron",pos:[.25,.25,.25]}
  ]);
  assert.equal(result.sites[0].active,false);
  assert.equal(result.sites[1].species,"Cr");
  assert.equal(result.sites[2].species,"C");
  assert.equal(result.markers.length,1);
});

test("nearest-site selection is bounded by snap radius",()=>{
  const sites=[{pos:[0,0,0]},{pos:[2,0,0]}];
  assert.equal(nearestSiteIndex(sites,[.1,0,0],.2),0);
  assert.equal(nearestSiteIndex(sites,[1,0,0],.2),-1);
});

test("analyzer summarizes structure composition and defects",()=>{
  const base=replicateCrystal("bcc",{preset:"Fe"});
  const result=analyzeCrystal({
    structureId:"bcc",preset:"Fe",baseSites:base,
    edits:[{type:"vacancy",baseIndex:0},{type:"manual",pos:[.25,.25,.25],atomType:"c"}]
  });
  assert.equal(result.structureName,"Body-centred cubic");
  assert.equal(result.coordinationNumber,8);
  assert.equal(result.defects.vacancy,1);
  assert.equal(result.defects.manual,1);
  assert.ok(result.composition.Fe>0);
  assert.equal(result.composition.C,1);
});


test("plane intersections reproduce legacy bond cut markers",()=>{
  assert.deepEqual(
    segmentPlaneIntersection([0,0,0],[1,0,0],[1,0,0],[.5,0,0]),
    [.5,0,0]
  );
  assert.equal(segmentPlaneIntersection([0,0,0],[0,1,0],[1,0,0],[.5,0,0]),null);

  const sites=[{pos:[0,0,0]},{pos:[1,0,0]}];
  const bonds=bondPairs(sites,2);
  const cuts=bondPlaneCuts(sites,bonds,[{label:"(1 0 0)",normal:[1,0,0],point:[.5,0,0]}]);
  assert.equal(cuts.length,1);
  assert.deepEqual(cuts[0].point,[.5,0,0]);
});
