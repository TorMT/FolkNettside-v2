import test from "node:test";
import assert from "node:assert/strict";
import {structurePanelHTML} from "../src/engineering/structure-panel.js";
import {resistancePanelHTML} from "../src/engineering/resistance-panel.js";
import {propulsionPanelHTML} from "../src/engineering/propulsion-panel.js";

test("Structure panel renders solved cantilever values",()=>{
  const fixture={
    name:"Cantilever",
    nodes:[{id:"root",x:0,y:0},{id:"tip",x:3,y:0}],
    elements:[{id:"beam",n1:"root",n2:"tip",E:210e9,A:.02,I:8e-6}],
    supports:[{node:"root",ux:true,uy:true,rz:true}],
    loads:[{node:"tip",fy:-20000}]
  };
  const panel=structurePanelHTML(fixture,{loadFy:-20000});
  assert.match(panel.summary,/Tip uy/);
  assert.match(panel.summary,/-107\.143 mm/);
  assert.match(panel.results,/60\.000 kNm/);
});

test("Resistance panel explicitly labels friction-only scope",()=>{
  const fixture={
    name:"ITTC",
    length:50,wettedSurface:500,density:1025,
    kinematicViscosity:1.19e-6,speedKnots:10,maxSpeedKnots:14,
    notes:"Friction only"
  };
  const panel=resistancePanelHTML(fixture,{speedKnots:10});
  assert.match(panel.summary,/12\.675 kN/);
  assert.match(panel.results,/not a total-resistance or CFD result/i);
});

test("Propulsion panel renders actuator-disk reference values",()=>{
  const fixture={
    name:"Disk",density:1025,diameter:1.5,thrust:20000,
    inflowSpeed:3,maxThrust:30000,notes:"Ideal"
  };
  const panel=propulsionPanelHTML(fixture,{thrustKn:20,inflowSpeed:3,diameter:1.5});
  assert.match(panel.summary,/1\.288 m\/s/);
  assert.match(panel.summary,/85\.75 kW/);
  assert.match(panel.results,/11\.318 kN\/m²/);
  assert.match(panel.viewport,/Ideal actuator disk flow estimate/);
});
