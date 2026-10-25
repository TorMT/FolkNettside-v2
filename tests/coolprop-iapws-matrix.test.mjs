import test from "node:test";
import assert from "node:assert/strict";
import {
  IAPWS_IF97_INDEPENDENT_CASES,IAPWS_IF97_SATURATION_CASES,IAPWS_IF97_LIMITS
} from "./fixtures/coolprop-iapws-if97-reference.mjs";
import {
  computeCourseReferenceTable,courseTableById,DEFAULT_UNITS
} from "../src/tools/coolprop-core.js";

test("IAPWS third-party benchmark fixture spans compressed water, vapor and saturation",()=>{
  assert.equal(IAPWS_IF97_INDEPENDENT_CASES.length,6);
  assert.equal(IAPWS_IF97_SATURATION_CASES.length,3);
  assert.deepEqual([...new Set(IAPWS_IF97_INDEPENDENT_CASES.map(c=>c.table))],[5,15]);
  assert.deepEqual([...new Set(IAPWS_IF97_SATURATION_CASES.map(c=>c.table))],[35]);
  for(const point of IAPWS_IF97_INDEPENDENT_CASES){
    assert.ok(point.P>0&&point.T>0,point.id);
    for(const [key,value] of Object.entries(point.expected)){
      assert.ok(Number.isFinite(value)&&value>0,point.id+" "+key);
      assert.ok(Number.isFinite(IAPWS_IF97_LIMITS.relative[key]),key);
    }
  }
  for(const point of IAPWS_IF97_SATURATION_CASES)
    assert.ok(point.T>273.15&&point.T<647.096&&point.expectedP>0,point.id);
});

test("reference-table Water headings and dimensional conversions stay consistent",()=>{
  assert.equal(courseTableById("Water","A-5")?.mode,"compressed");
  assert.equal(courseTableById("Water","A-4")?.mode,"superheated");
  assert.equal(courseTableById("Water","A-2")?.mode,"sat-T");
  const engine={
    propsSI(prop,k1,v1,k2,v2){
      const x=Object.fromEntries([[k1,v1],[k2,v2]]);
      const T=x.T||300,P=x.P||3e6;
      return {T,P,D:1000,H:115331.273,U:112324.818,S:392.294792,
        Cpmass:4173.01218,Cvmass:4100,viscosity:0.001,
        conductivity:0.6,speed_sound:1507.73921,Prandtl:7,Q:-1,
        Phase:0}[prop] ?? 1;
    },
    phaseSI(){return "liquid"}
  };
  const rows=computeCourseReferenceTable(engine,{
    fluid:"Water",tableId:"A-5",rows:"26.85,30",units:DEFAULT_UNITS
  });
  assert.equal(rows[0].Status,"OK");
  assert.equal(rows[0].H,115.331273);
  assert.equal(rows[0].U,112.324818);
  assert.equal(rows[0].S,0.392294792);
  assert.equal(rows[0].v,0.001);
  assert.equal(rows[0].P,30);
});
