import test from "node:test";
import assert from "node:assert/strict";
import {solveHullGirder} from "../src/structure/hull-girder.js";
import {girderResponseCSV,girderLoadsCSV,girderReactionsCSV,girderSectionsCSV}
  from "../src/structure/girder-export.js";
import {hullGirderActionDiagram,hullGirderPanelHTML}
  from "../src/engineering/hull-girder-panel.js";

const makeBeam=({pointWeights=[],segments=4}={})=>solveHullGirder({
 xMin:0,xMax:10,hullMassTonnes:10,hullCG:[5,0,0.5],
 pointWeights,E:210e9,I:.08,extremeFiberM:1,segments
});

test("beam equilibrium moment residual and shear/moment diagrams render with units",()=>{
 const r=makeBeam({pointWeights:[{massTonnes:2,x:5,y:0,z:1}]});
 assert.equal(r.equilibriumAudit.passed,true);
 assert.ok(Math.abs(r.equilibriumAudit.forceResidualN)<.01);
 assert.ok(Math.abs(r.equilibriumAudit.momentResidualNm)<.01);
 const shear=hullGirderActionDiagram(r,{metric:"shear"});
 const moment=hullGirderActionDiagram(r,{metric:"moment"});
 assert.match(shear,/beam shear force V/);
 assert.match(moment,/bending moment M/);
 assert.match(shear,/kN/);
 assert.match(moment,/kN·m/);
 assert.match(moment,/<path d="M/);
 assert.equal(hullGirderActionDiagram(r,{metric:"invalid"}),"");
 const panel=hullGirderPanelHTML({result:r});
 assert.equal((panel.results.match(/class="hull-fem-action-chart"/g)||[]).length,2);
 assert.match(panel.summary,/Pitch-moment equilibrium error/);
 assert.match(panel.summary,/Maximum deflection location/);
});

test("response CSV preserves each element-side X and SI force/stress units",()=>{
 const beam=makeBeam({pointWeights:[{massTonnes:1,x:5,y:0,z:1}]});
 const csv=girderResponseCSV(beam);
 const rows=csv.trim().split("\n");
 assert.equal(rows.length,beam.field.length+1);
 assert.equal(rows[0],"x_m,deflection_m,shear_N,bending_moment_Nm,longitudinal_extreme_fibre_stress_Pa");
 assert.ok(rows.filter(row=>row.startsWith("5,")).length>=2,
  "Shear discontinuities should retain both FEM element-side values");
 assert.equal(rows.some(row=>row.includes("NaN")),false);
 const data=rows.slice(1).map(line=>line.split(",").map(Number));
 assert.ok(data.every(row=>row.length===5&&row.every(Number.isFinite)));
 assert.ok(data.some((row,i)=>i>0&&row[0]===data[i-1][0]&&row[2]!==data[i-1][2]),
  "Shear jump must not be smoothed away by CSV generation");
});
test("load and reaction CSV totals close the independent force and moment audit",()=>{
 const beam=makeBeam({pointWeights:[{massTonnes:2,x:3,y:0,z:1}]});
 const csv=girderLoadsCSV(beam);
 const rows=csv.trim().split("\n").slice(1).map(s=>s.split(",").map(Number));
 const total=rows.reduce((sum,row)=>sum+(row[1]-row[0])*row[4],0);
 const reactionRows=girderReactionsCSV(beam).trim().split("\n").slice(1)
   .map(s=>s.split(",").map(Number));
 const reactions=reactionRows.reduce((sum,row)=>sum+row[1],0);
 // The load CSV excludes point masses, so add their gravity explicitly.
 assert.ok(Math.abs(total-2*1000*9.80665+reactions)<.01);
 assert.equal(girderReactionsCSV(beam).split("\n")[0],
   "x_m,vertical_support_reaction_N");
 assert.throws(()=>girderResponseCSV({field:[]}),/Calculate/);
 assert.throws(()=>girderReactionsCSV({equilibriumAudit:{passed:false},reactions:[]}),/Validated/);
});

test("section CSV lists actual local EI and baseline tonnes/metre used by the FEM",()=>{
 const g=solveHullGirder({
   xMin:0,xMax:10,hullMassTonnes:50,hullCG:[6.5,0,1],
   E:210e9,I:.1,extremeFiberM:1,segments:6,
   stiffnessStations:[
     {x0:0,x1:5,E:200e9,I:.05},
     {x0:5,x1:10,E:210e9,I:.1}
   ],
   massStations:[
     {x0:0,x1:5,tonnesPerM:2},
     {x0:5,x1:10,tonnesPerM:8}
   ]
 });
 const lines=girderSectionsCSV(g).trim().split("\n");
 assert.equal(lines.length,g.frame.elements.length+1);
 assert.equal(lines[0],"x_from_m,x_to_m,young_modulus_Pa,section_inertia_m4,bending_rigidity_N_m2,baseline_mass_t_per_m");
 const rows=lines.slice(1).map(line=>line.split(",").map(Number));
 assert.ok(rows.some(r=>r[2]===200e9&&r[3]===.05&&r[5]===2));
 assert.ok(rows.some(r=>r[2]===210e9&&r[3]===.1&&r[5]===8));
 assert.ok(rows.every(r=>Math.abs(r[4]-r[2]*r[3])<1e-3));
 assert.throws(()=>girderSectionsCSV({}),/Calculate/);
});
