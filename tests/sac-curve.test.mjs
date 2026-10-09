import test from "node:test";
import assert from "node:assert/strict";
import {sectionalAreaAtStation,sectionalAreaCurve,sacCSV} from "../src/hydro/sac-curve.js";
import {sacCurvePanelHTML} from "../src/engineering/sac-panel.js";

// Analytical watertight box: length 10, width 3, height 2 m.
// At waterline z=1 m, submerged cross-section is 3 m2, volume is 30 m3.
const vertices=[
 [0,-1.5,0],[10,-1.5,0],[10,1.5,0],[0,1.5,0],
 [0,-1.5,2],[10,-1.5,2],[10,1.5,2],[0,1.5,2]
];
const faces=[
 0,2,1,0,3,2, 4,5,6,4,6,7,
 0,1,5,0,5,4, 3,7,6,3,6,2,
 0,4,7,0,7,3, 1,2,6,1,6,5
];
const geometry={positions:vertices.flat(),indices:faces};
test("SAC clips the section at the selected draft and integrates an analytic box",()=>{
 const at1=sectionalAreaAtStation([geometry],5,1);
 const at2=sectionalAreaAtStation([geometry],5,2);
 const at0=sectionalAreaAtStation([geometry],5,0);
 assert.ok(Math.abs(at1.area-3)<1e-7,JSON.stringify(at1));
 assert.ok(Math.abs(at2.area-6)<1e-7);
 assert.ok(at0.area<1e-7);
 const curve=sectionalAreaCurve({components:[{geometry}]},{draft:1,stations:21});
 assert.ok(Math.abs(curve.maximumSectionArea-3)<1e-6);
 assert.ok(Math.abs(curve.estimatedVolume-30)<1e-5);
 assert.match(sacCSV(curve),/^station_x_m,underwater_section_area_m2\n/);
 const chart=sacCurvePanelHTML(curve);
 assert.match(chart,/Sectional Area Curve/);
 assert.match(chart,/<svg/);
});
test("SAC rejects invalid inputs rather than inventing vessel particulars",()=>{
 assert.throws(()=>sectionalAreaCurve({components:[]},{draft:1}),/No selected hull/);
 assert.throws(()=>sectionalAreaCurve({components:[{geometry}]},{draft:1,stations:102}),/3 to 101/);
 assert.throws(()=>sectionalAreaAtStation([geometry],5,NaN),/finite/);
 assert.throws(()=>sectionalAreaAtStation([geometry],5,1,{maxTriangles:3}),/budget/);
});
