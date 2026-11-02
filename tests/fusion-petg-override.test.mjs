import test from "node:test";
import assert from "node:assert/strict";
import {validateFusionEngineeringManifest} from "../src/model/parsers/fusion-engineering-bundle.js";
import {fusionEngineeringReportHTML} from "../src/engineering/fusion-engineering-report.js";

const volume=0.026443944130719415, density=1270;
const original=207.58496142614743, calculated=volume*density;
const fixture={
 schema:"folknet-fusion-v1",title:"ASV PETG derived",
 sourceFile:"ASV Assembly",exportedAt:"2026-11-02",
 geometry:{path:"assembly.step",units:"millimeter"},
 properties:{massUnit:"kg",volumeUnit:"m3",centerUnit:"m",lengthUnit:"m",
   inertiaUnit:"kg*m2",source:"DERIVED uniform PETG estimate"},
 total:{massKg:calculated,solidVolumeM3:volume,
   centerOfMassM:[-.1913458654,-.0000370248,-.0004647396],
   inertiaWorldKgM2:{xx:.32,yy:.41,zz:.51,xy:0,yz:0,xz:0}},
 occurrences:[{name:"Hull",fullPath:"Hull:1",massKg:calculated,
  solidVolumeM3:volume,centerOfMassM:[0,0,0]}],
 derivedPETG:{material:"PETG (assumed)",densityKgPerM3:density,
   originalFusionMassKg:original,estimatedMassKg:calculated,
   scalingFactor:calculated/original,source:"Uniform PETG substitution"}
};

test("derived PETG bundle retains its unqualified estimate provenance",()=>{
 const data=validateFusionEngineeringManifest(fixture);
 assert.equal(data.materialEstimate.kind,"uniform-density-estimate");
 assert.equal(data.total.massKg,calculated);
 assert.match(data.total.qualification,/Derived uniform PETG/);
 const html=fusionEngineeringReportHTML(data);
 assert.match(html,/Derived PETG material estimate/);
 assert.match(html,/Estimated assembly mass/);
 assert.match(html,/density 1,270 kg\/m³/);
 assert.match(html,/33\.584 kg/);
 assert.match(html,/207\.585 kg/);
 assert.match(html,/Estimated, density-scaled mass moments/);
 assert.doesNotMatch(html,/Fusion API · physical measurements/);
 assert.doesNotMatch(html,/Measured in Fusion, not calculated/);
});

test("derived override must be self-consistent and explicitly declared",()=>{
 const cases=[
  {...fixture,derivedPETG:{...fixture.derivedPETG,estimatedMassKg:900}},
  {...fixture,total:{...fixture.total,massKg:12}},
  {...fixture,properties:{...fixture.properties,source:"Autodesk Fusion"}},
  {...fixture,occurrences:[{...fixture.occurrences[0],massKg:4}]},
  {...fixture,derivedPETG:{...fixture.derivedPETG,densityKgPerM3:9000}}
 ];
 for(const invalid of cases)
  assert.throws(()=>validateFusionEngineeringManifest(invalid),/derived material|DERIVED/i);
});

test("normal Fusion API imports are still labelled source-measured",()=>{
 const {derivedPETG,...native}=fixture;
 const result=validateFusionEngineeringManifest({
  ...native,
  properties:{...native.properties,source:"Autodesk Fusion HighCalculationAccuracy"}
 });
 assert.equal(result.materialEstimate,undefined);
 assert.match(result.total.qualification,/Fusion physical properties/);
 const html=fusionEngineeringReportHTML(result);
 assert.match(html,/Fusion API · physical measurements/);
 assert.match(html,/Assembly mass \(Fusion materials\)/);
});
