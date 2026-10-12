import test from "node:test";
import assert from "node:assert/strict";
import {validateFusionEngineeringManifest}
  from "../src/model/parsers/fusion-engineering-bundle.js";
import {fusionEngineeringReportHTML}
  from "../src/engineering/fusion-engineering-report.js";

const fixture={
  schema:"folknet-fusion-v1",title:"Ship prototype",
  sourceFile:"Docking assembly",
  exportedAt:"2026-10-12T11:00:00+00:00",
  geometry:{path:"assembly.step",units:"millimeter"},
  properties:{
    massUnit:"kg",volumeUnit:"m3",centerUnit:"m",lengthUnit:"m",
    source:"Autodesk Fusion HighCalculationAccuracy"
  },
  total:{massKg:650,solidVolumeM3:.08,surfaceAreaM2:3.2,
    boundsM:{min:[-2,-1,0],max:[4,1,3]},centerOfMassM:[2,-1,.7]},
  occurrences:[
    {name:"Frame",fullPath:"Hull:1+Frame:2",massKg:250,
      solidVolumeM3:.03,centerOfMassM:[1,0,1]},
    {name:"Frame",fullPath:"Hull:2+Frame:2",massKg:250,
      solidVolumeM3:.03,centerOfMassM:[3,0,1]}
  ]
};

test("native Fusion source properties retain SI units and explicit physical provenance",()=>{
 const normalized=validateFusionEngineeringManifest(fixture);
 assert.equal(normalized.total.massKg,650);
 assert.equal(normalized.total.solidVolumeM3,.08);
 assert.equal(normalized.total.surfaceAreaM2,3.2);
 assert.deepEqual(normalized.total.boundsM.max,[4,1,3]);
 assert.deepEqual(normalized.total.centerOfMassM,[2,-1,.7]);
 assert.equal(normalized.occurrences.length,2);
 assert.equal(normalized.occurrences[0].isOccurrenceAggregate,true);
 assert.equal(normalized.geometry.format,"STEP");
 const html=fusionEngineeringReportHTML(normalized);
 assert.match(html,/Assembly mass/);
 assert.match(html,/650 kg/);
 assert.match(html,/0\.08 m³/);
 assert.match(html,/CAD body surface area/);
 assert.match(html,/XYZ envelope/);
 assert.match(html,/6 × 2 × 3 m/);
 assert.match(html,/2 \/ -1 \/ 0\.7 m/);
 assert.match(html,/NOT the/);
 assert.match(html,/do not sum nested aggregates/);
});

test("malicious or ambiguous geometry paths are rejected",()=>{
 for(const path of ["../escape.step","/etc/passwd.step","a\\x.step",
  "design.stl","design.f3d","a/../b.step","a//b.step","a.step#bad"]){
   assert.throws(()=>validateFusionEngineeringManifest({
     ...fixture,geometry:{path,units:"millimeter"}
   }),/safe STEP/);
 }
});
test("unit and physical-source errors never silently pass",()=>{
 assert.throws(()=>validateFusionEngineeringManifest({
   ...fixture,geometry:{path:"assembly.step",units:"meter"}
 }),/millimeter/);
 assert.throws(()=>validateFusionEngineeringManifest({
   ...fixture,properties:{...fixture.properties,massUnit:"tonne"}
 }),/SI/);
 assert.throws(()=>validateFusionEngineeringManifest({
   ...fixture,total:{...fixture.total,massKg:NaN}
 }),/invalid/);
 assert.throws(()=>validateFusionEngineeringManifest({
   ...fixture,total:{...fixture.total,centerOfMassM:[2,1]}
 }),/invalid/);
 assert.throws(()=>validateFusionEngineeringManifest({...fixture,schema:"native-f3d"}),/Unsupported/);
});
test("untrusted occurrence names are escaped and never interpreted as markup",()=>{
 const item={...fixture.occurrences[0],fullPath:'<img src=x onerror="alert(1)">'};
 const html=fusionEngineeringReportHTML(validateFusionEngineeringManifest({
   ...fixture,occurrences:[item]
 }));
 assert.match(html,/&lt;img/);
 assert.doesNotMatch(html,/<img/);
});
test("nested occurrence masses are not summed to reconstruct top-level mass",()=>{
 const normalized=validateFusionEngineeringManifest({
   ...fixture,
   occurrences:[{...fixture.occurrences[0],massKg:900},{...fixture.occurrences[1],massKg:800}]
 });
 assert.equal(normalized.total.massKg,650);
 const rendered=fusionEngineeringReportHTML(normalized);
 assert.match(rendered,/650 kg/);
});

test("unqualified bounds and surface-area values are rejected rather than rendered",()=>{
 assert.throws(()=>validateFusionEngineeringManifest({...fixture,
   total:{...fixture.total,boundsM:{min:[0,0,0],max:[-1,1,1]}}
 }),/bounding extents/);
 assert.throws(()=>validateFusionEngineeringManifest({...fixture,
   total:{...fixture.total,surfaceAreaM2:-5}
 }),/surface area/);
 const minimal=validateFusionEngineeringManifest({...fixture,
   total:{massKg:1,solidVolumeM3:1,centerOfMassM:[0,0,0]}
 });
 assert.ok(!Object.hasOwn(minimal.total,"boundsM"));
 assert.ok(!Object.hasOwn(minimal.total,"surfaceAreaM2"));
});

test("SI world moments and principal moments survive import and are shown with provenance",()=>{
 const world={xx:40,yy:50,zz:60,xy:-5,yz:2,xz:-3};
 const extended={...fixture,
   properties:{...fixture.properties,inertiaUnit:"kg*m2",
     inertiaWorldReference:"Fusion world-coordinate system"},
   total:{...fixture.total,inertiaWorldKgM2:world,
     principalMomentsKgM2:[30,50,70]},
   occurrences:[{...fixture.occurrences[0],inertiaWorldKgM2:world}]
 };
 const result=validateFusionEngineeringManifest(extended);
 assert.deepEqual(result.total.inertiaWorldKgM2,world);
 assert.deepEqual(result.total.principalMomentsKgM2,[30,50,70]);
 assert.deepEqual(result.occurrences[0].inertiaWorldKgM2,world);
 const html=fusionEngineeringReportHTML(result);
 assert.match(html,/moments of inertia/);
 assert.match(html,/40 \/ 50 \/ 60/);
 assert.match(html,/-5 \/ 2 \/ -3/);
 assert.match(html,/30 \/ 50 \/ 70/);
 assert.match(html,/tensor off-diagonal signs depend on convention/);
});

test("Fusion inertia is optional for pre-existing bundles but strict if present",()=>{
 const older=validateFusionEngineeringManifest(fixture);
 assert.equal(older.total.inertiaWorldKgM2,undefined);
 const withMoments={...fixture,total:{...fixture.total,
   inertiaWorldKgM2:{xx:1,yy:2,zz:3,xy:0,yz:0,xz:0}}};
 assert.throws(()=>validateFusionEngineeringManifest(withMoments),/explicit kg\*m2/);
 const qualified={...withMoments,
   properties:{...fixture.properties,inertiaUnit:"kg*m2"}};
 assert.doesNotThrow(()=>validateFusionEngineeringManifest(qualified));
 for(const bad of [
   {...qualified,total:{...qualified.total,
     inertiaWorldKgM2:{...qualified.total.inertiaWorldKgM2,yy:-1}}},
   {...qualified,total:{...qualified.total,principalMomentsKgM2:[1,2,-3]}},
   {...qualified,total:{...qualified.total,principalMomentsKgM2:[1,2]}},
   {...qualified,total:{...qualified.total,
     inertiaWorldKgM2:{xx:1,yy:2,zz:3,xy:NaN,yz:0,xz:0}}},
   {...qualified,properties:{...qualified.properties,inertiaUnit:"kg*cm2"}}
 ]){
   assert.throws(()=>validateFusionEngineeringManifest(bad),/inertia|moments/);
 }
});
