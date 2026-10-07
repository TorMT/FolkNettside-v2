import test from "node:test";
import assert from "node:assert/strict";
import {replicateCrystal} from "../src/tools/crystal-structures-core.js";
import {
  analyzeCrystal,applyCrystalEdits,bondPairs,bondPlaneCuts,closePackedPlaneSpecs,
  coordinationStats,firstShellCutoff,identifyCrystal,
  coordinationPolyhedron,convexHullTriangles,nearestSitesToPoint,planeBoxPolygon,
  polyhedronEdges,sitesNearPlane,
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


test("first-shell detection separates a clear neighbor shell",()=>{
  const cutoff=firstShellCutoff([1,1,1,1,1.8,2]);
  assert.ok(cutoff>1&&cutoff<1.2);
});

test("coordination stats recover a BCC-like center coordination",()=>{
  const center={pos:[0,0,0],species:"Fe",active:true};
  const corners=[];
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])corners.push({pos:[x,y,z],species:"Fe",active:true});
  const stats=coordinationStats([center,...corners]);
  assert.equal(stats.values[0],8);
});

test("crystal identification preserves explicit structure knowledge",()=>{
  const sites=[
    {pos:[0,0,0],species:"Fe",active:true},
    {pos:[1,1,1],species:"Fe",active:true}
  ];
  const result=identifyCrystal({structureId:"bcc",sites});
  assert.equal(result.type,"BCC (Body-Centered Cubic)");
  assert.ok(result.confidence>=90);
});

test("crystal identification retains legacy alloy heuristics",()=>{
  const steel=identifyCrystal({
    sites:[
      ...Array.from({length:99},(_,i)=>({pos:[i,0,0],species:"Fe",active:true})),
      {pos:[.5,.5,.5],species:"C",active:true}
    ]
  });
  assert.match(steel.type,/Carbon steel/i);

  const stainless=identifyCrystal({
    sites:[
      ...Array.from({length:8},(_,i)=>({pos:[i,0,0],species:"Fe",active:true})),
      ...Array.from({length:2},(_,i)=>({pos:[i,.5,0],species:"Cr",active:true})),
      {pos:[0,1,0],species:"Ni",active:true}
    ]
  });
  assert.match(stainless.type,/Stainless/i);
});


test("fcc tetrahedral hole uses four equidistant nearest atoms",()=>{
  const sites=[
    {pos:[0,0,0]},{pos:[.5,.5,0]},{pos:[.5,0,.5]},{pos:[0,.5,.5]},
    {pos:[1,1,1]}
  ];
  const poly=coordinationPolyhedron(sites,[.25,.25,.25],4);
  assert.equal(poly.points.length,4);
  assert.equal(poly.faces.length,4);
  const d0=poly.distances[0];
  for(const d of poly.distances)assert.ok(Math.abs(d-d0)<1e-12);
});

test("octahedral coordination hull has eight triangular faces",()=>{
  const sites=[
    {pos:[1,0,0]},{pos:[-1,0,0]},
    {pos:[0,1,0]},{pos:[0,-1,0]},
    {pos:[0,0,1]},{pos:[0,0,-1]}
  ];
  const poly=coordinationPolyhedron(sites,[0,0,0],6);
  assert.equal(poly.points.length,6);
  assert.equal(poly.faces.length,8);
});

test("plane box polygon clips a diagonal plane to the visible bounds",()=>{
  const polygon=planeBoxPolygon([1,1,1],[.5,.5,.5],{min:[0,0,0],max:[1,1,1]});
  assert.ok(polygon.length>=3);
  for(const point of polygon){
    assert.ok(point.every(value=>value>=-1e-9&&value<=1+1e-9));
    assert.ok(Math.abs(point[0]+point[1]+point[2]-1.5)<1e-8);
  }
});

test("nearest site lookup returns deterministic sorted distances",()=>{
  const nearest=nearestSitesToPoint(
    [{pos:[2,0,0]},{pos:[1,0,0]},{pos:[3,0,0]}],
    [0,0,0],2
  );
  assert.deepEqual(nearest.map(item=>item.index),[1,0]);
  assert.deepEqual(nearest.map(item=>item.distance),[1,2]);
});


test("HCP close-packed basal planes are normal to the c axis",()=>{
  const planes=closePackedPlaneSpecs("hcp");
  assert.equal(planes.length,2);
  for(const plane of planes)assert.deepEqual(plane.normal,[0,0,1]);
  assert.deepEqual(planes[0].point,[0,0,0]);
  assert.deepEqual(planes[1].point,[0,0,.5]);
});

test("tetrahedral and octahedral hulls expose unique polyhedron edges",()=>{
  assert.equal(polyhedronEdges([[0,1,2],[0,3,1],[0,2,3],[1,3,2]]).length,6);
  const octaFaces=[
    [0,2,4],[2,1,4],[1,3,4],[3,0,4],
    [2,0,5],[1,2,5],[3,1,5],[0,3,5]
  ];
  assert.equal(polyhedronEdges(octaFaces).length,12);
});

test("plane atom selection is geometric and tolerance-bounded",()=>{
  const plane={normal:[0,0,1],point:[0,0,.5]};
  const sites=[
    {pos:[0,0,.5],active:true},
    {pos:[1,0,.54],active:true},
    {pos:[0,1,.7],active:true},
    {pos:[0,0,.5],active:false}
  ];
  const near=sitesNearPlane(sites,plane,.05);
  assert.deepEqual(near.map(item=>item.index),[0,1]);
});
