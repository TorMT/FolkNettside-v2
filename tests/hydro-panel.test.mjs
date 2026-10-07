import test from "node:test";
import assert from "node:assert/strict";
import {hydroPanelHTML} from "../src/engineering/hydro-panel.js";

function panel(overrides={}){
  return hydroPanelHTML({
    modelDocument:{name:"Fixture vessel"},
    result:{
      volume:40,
      centerOfBuoyancy:[0,0,.5],
      components:[{componentId:"hull"}],
      waterplane:{area:40,ixx:53.333333,iyy:333.333333,ixy:0}
    },
    curve:[],
    draft:1,
    targetDisplacementTonnes:"",
    kg:"",
    geometryWarnings:[],
    config:{density:1000,minDraft:0,maxDraft:2},
    ...overrides
  });
}

test("Hydro panel exposes CG, attitude and equilibrium controls",()=>{
  const html=panel().inspector;
  for(const id of [
    "hydro-target","hydro-lcg","hydro-tcg","hydro-kg",
    "hydro-heel","hydro-trim","hydro-attitude","hydro-gz",
    "hydro-equilibrium-heel","hydro-equilibrium-trim"
  ]){
    assert.match(html,new RegExp(`id="${id}"`),id+" missing");
  }
});

test("Hydro panel renders attitude and solved-equilibrium diagnostics",()=>{
  const html=panel({
    kg:.5,lcg:.2,tcg:.1,heel:2,trim:-1,
    attitudeAction:"trimEq",
    attitude:{
      heelDeg:2,trimDeg:-1.2345,waterline:1.04567,
      centerOfBuoyancy:[.2,.1,.52],
      rollLever:.001,pitchLever:-.002,
      equilibriumAngle:-1.2345,residual:2e-8
    }
  }).inspector;
  assert.match(html,/Trim equilibrium/);
  assert.match(html,/equilibrium -1\.2345°/);
  assert.match(html,/residual 2\.00e-8 m/);
});


test("Hydro panel renders standard hydrostatic particulars and curve table",()=>{
  const curve=[.5,1,1.5].map(draft=>({
    waterline:draft,
    volume:40*draft,
    centerOfBuoyancy:[0,0,draft/2],
    components:[{componentId:"hull"}],
    waterplane:{area:40,centroid:[0,0],ixx:53.333333,iyy:333.333333,ixy:0}
  }));
  const rendered=panel({curve,kg:.6});
  assert.match(rendered.summary,/TPC/);
  assert.match(rendered.results,/LCF/);
  assert.match(rendered.results,/Hydrostatic table/);
  assert.match(rendered.results,/Displacement/);
  assert.match(rendered.results,/GM transverse/);
  assert.equal(rendered.curveRows.length,3);
  assert.ok(rendered.particulars.tonnesPerCm>0);
});


test("Hydro panel exposes CSV exports and GZ summary when stability curve exists",()=>{
  const curve=[.5,1,1.5].map(draft=>({
    waterline:draft,volume:40*draft,centerOfBuoyancy:[0,0,draft/2],
    components:[{componentId:"hull"}],
    waterplane:{area:40,centroid:[0,0],ixx:53.333333,iyy:333.333333,ixy:0}
  }));
  const gz=[
    {heelDeg:0,gz:0,rightingMoment:0,waterline:1,displacementMass:40000},
    {heelDeg:5,gz:.08,rightingMoment:31381,waterline:1.01,displacementMass:40000},
    {heelDeg:10,gz:.12,rightingMoment:47072,waterline:1.02,displacementMass:40000}
  ];
  const rendered=panel({curve,kg:.6,gz});
  assert.match(rendered.results,/id="hydro-export-table"/);
  assert.match(rendered.results,/id="hydro-export-gz"/);
  assert.match(rendered.results,/Max GZ/);
  assert.match(rendered.results,/Area \+heel/);
  assert.equal(rendered.gzSummary.valid,true);
  assert.equal(rendered.gzSummary.angleAtMaxGz,10);
});
