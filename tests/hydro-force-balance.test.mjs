import test from "node:test";
import assert from "node:assert/strict";
import {hydroForceBalance,hydroForceInputs} from "../src/engineering/hydro-force-balance.js";
import {hydroForcesHTML} from "../src/engineering/hydro-force-diagram.js";
const result={
 volume:40,centerOfBuoyancy:[1,0,.5],
 components:[
  {componentId:"h1",name:"Port section",volume:10,centerOfBuoyancy:[-2,-.5,.4]},
  {componentId:"h2",name:"Starboard section",volume:30,centerOfBuoyancy:[2,.5,.55]}
 ]
};
const gravityTonnes=40; // in fresh water one tonne per cubic metre
test("Archimedes force matches gravity exactly at 40 m3 fresh water and 40 t",()=>{
 const f=hydroForceBalance({hydroResult:result,densityKgM3:1000,
   loadedMass:gravityTonnes,centerOfGravity:[0,0,1]});
 assert.ok(Math.abs(f.buoyancyKN-392.266)<1e-10);
 assert.ok(Math.abs(f.gravityKN-392.266)<1e-10);
 assert.ok(Math.abs(f.residualKN)<1e-10);
 assert.equal(f.balanced,true);
 assert.ok(Math.abs(f.components.reduce((sum,c)=>sum+c.buoyancyKN,0)-f.buoyancyKN)<1e-10);
 assert.deepEqual(f.centerOfBuoyancy,[1,0,.5]);
 assert.deepEqual(f.centerOfGravity,[0,0,1]);
});
test("new load raises weight without silently recomputing reference hydrostatic displacement",()=>{
 const loaded=hydroForceBalance({hydroResult:result,densityKgM3:1000,
   loadedMass:42,centerOfGravity:[1,0,1.5]});
 assert.ok(Math.abs(loaded.residualKN+19.6133)<1e-7);
 assert.equal(loaded.balanced,false);
 assert.deepEqual(loaded.centerOfBuoyancy,[1,0,.5]);
});
test("unknown hull mass is never replaced by an inferred displacement weight",()=>{
 const input=hydroForceInputs({kg:1,hullMassText:""});
 assert.equal(input.loadedMass,null);
 assert.equal(input.centerOfGravity,null);
 const f=hydroForceBalance({hydroResult:result,densityKgM3:1025,...input});
 assert.equal(f.gravityKN,null);
 assert.equal(f.residualKN,null);
 assert.equal(f.massKnown,false);
 const inferred=hydroForceInputs({hullMassText:"12",kg:"3",lcg:"0",tcg:"0"});
 assert.deepEqual(inferred,{loadedMass:12,centerOfGravity:[0,0,3]});
});
test("combined loading beats initial empty hull fields; negative mass changes weight correctly",()=>{
 const inputs=hydroForceInputs({pointWeightSummary:{
   totalMassTonnes:39,centerOfGravity:[-1,0,2],
   pointWeights:[{massTonnes:-1,x:3,y:0,z:2}]
 },hullMassText:""});
 assert.equal(inputs.loadedMass,39);
 assert.deepEqual(inputs.centerOfGravity,[-1,0,2]);
});
test("legacy per-component omissions are displayed as unknown, not invented partial buoyancy",()=>{
 const f=hydroForceBalance({hydroResult:{...result,components:[{componentId:"only-name"}]}});
 assert.equal(f.components.length,0);
 assert.throws(()=>hydroForceBalance({hydroResult:{volume:-3,centerOfBuoyancy:[0,0,0]}}),/valid submerged volume/);
 assert.throws(()=>hydroForceBalance({hydroResult:result,densityKgM3:0}),/valid submerged volume/);
});
test("Hydro force results render annotated CB/CG, force residual, and distributed area/point weights",()=>{
 const html=hydroForcesHTML({modelDocument:{components:[]},result,densityKgM3:1000,draft:1,
   pointWeightSummary:{
     totalMassTonnes:42,centerOfGravity:[.2,0,1.4],
     pointWeights:[{massTonnes:1,x:0,y:0,z:1}],
     areaLoads:[{massTonnes:1,x:2,y:0,z:2}]
   }});
 assert.match(html,/392\.27 kN/);
 assert.match(html,/Not in vertical force equilibrium/);
 assert.match(html,/CB ↑/);
 assert.match(html,/CG ↓/);
 assert.match(html,/Area 1/);
 assert.match(html,/Point 1/);
 assert.match(html,/structural load distribution/);
 const unknown=hydroForcesHTML({modelDocument:{components:[]},result,draft:1});
 assert.match(unknown,/Unknown — enter hull\/load mass/);
 assert.doesNotMatch(unknown,/CG ↓/);
});
