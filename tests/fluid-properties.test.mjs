import test from "node:test";
import assert from "node:assert/strict";
import {fluidProperties,toCelsius} from "../src/tools/fluid-properties.js";

const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);

test("temperature units map to the same Celsius value",()=>{
  near(toCelsius(20,"C"),20);
  near(toCelsius(68,"F"),20);
  near(toCelsius(293.15,"K"),20);
});

test("air legacy fit returns derived properties consistently",()=>{
  const r=fluidProperties("air",20,"C");
  near(r.density,1.2022,1e-12);
  near(r.kinematicViscosity,r.dynamicViscosity/r.density,1e-16);
  near(r.thermalDiffusivity,r.conductivity/(r.density*r.cp),1e-16);
  near(r.prandtl,r.dynamicViscosity*r.cp/r.conductivity,1e-12);
  assert.equal(r.warnings.length,0);
});

test("water fit warns outside documented range",()=>{
  const r=fluidProperties("water",120,"C");
  assert.equal(r.warnings.length,1);
});

test("invalid absolute temperature is rejected",()=>{
  assert.throws(()=>fluidProperties("air",0,"K"),/absolute zero/);
});
