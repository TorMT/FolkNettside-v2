import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeThrusterSystem,azimuthAxis,thrusterContribution,thrustersFromModelDocument
} from "../src/propulsion/thruster-system.js";

const near=(actual,expected,tol=1e-9)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} != ${expected}`);

test("azimuth axes follow vessel x-y convention",()=>{
  const a0=azimuthAxis(0);
  const a90=azimuthAxis(90);
  near(a0[0],1);near(a0[1],0);
  near(a90[0],0,1e-12);near(a90[1],1);
});

test("null azimuth never overrides an explicit tunnel axis",()=>{
  const r=thrusterContribution({
    thrust:10000,axis:[0,1,0],azimuthDeg:null,position:[0,0,0]
  });
  assert.deepEqual(r.axis,[0,1,0]);
  assert.deepEqual(r.force,[0,10000,0]);
});

test("undefined or empty azimuth preserves explicit axis",()=>{
  for(const azimuthDeg of [undefined,""]){
    const r=thrusterContribution({
      thrust:1000,axis:[0,1,0],azimuthDeg,position:[0,0,0]
    });
    assert.deepEqual(r.axis,[0,1,0]);
  }
});

test("offset lateral thruster creates yaw moment r cross F",()=>{
  const r=thrusterContribution({
    thrust:10000,axis:[0,1,0],position:[5,0,0],reference:[0,0,0]
  });
  assert.deepEqual(r.force,[0,10000,0]);
  assert.deepEqual(r.moment,[0,0,50000]);
});

test("symmetric azimuth pair sums surge and cancels yaw",()=>{
  const result=analyzeThrusterSystem([
    {id:"ps",thrust:20000,axis:[1,0,0],position:[-2,2,0]},
    {id:"sb",thrust:20000,axis:[1,0,0],position:[-2,-2,0]}
  ]);
  near(result.totalForce[0],40000);
  near(result.totalForce[1],0);
  near(result.totalMoment[2],0);
});

test("bow tunnel thruster creates sway and yaw",()=>{
  const result=analyzeThrusterSystem([
    {id:"tunnel",thrust:5000,axis:[0,1,0],position:[8,0,0]}
  ]);
  assert.deepEqual(result.totalForce,[0,5000,0]);
  assert.deepEqual(result.totalMoment,[0,0,40000]);
});

test("combined azimuth pair and tunnel thruster remains analytically traceable",()=>{
  const result=analyzeThrusterSystem([
    {id:"az-ps",thrust:15000,azimuthDeg:0,position:[-4,2,0]},
    {id:"az-sb",thrust:15000,azimuthDeg:0,position:[-4,-2,0]},
    {id:"tunnel",thrust:4000,axis:[0,1,0],position:[7,0,0]}
  ]);
  near(result.totalForce[0],30000);
  near(result.totalForce[1],4000);
  near(result.totalMoment[2],28000);
  near(result.resultantThrust,Math.hypot(30000,4000));
});

test("ModelDocument thruster metadata uses world transform and unit scale",()=>{
  const model={
    unitScaleToMeters:.001,
    components:[{
      id:"az",name:"Azimuth",
      transform:[1,0,0,0, 0,1,0,0, 0,0,1,0, 5000,2000,0,1],
      metadata:{propulsion:{thrust:10000,axis:[1,0,0],diameter:1000}}
    }]
  };
  const [thruster]=thrustersFromModelDocument(model);
  assert.deepEqual(thruster.position,[5,2,0]);
  assert.deepEqual(thruster.axis,[1,0,0]);
});


test("semantic thruster metadata supports azimuth and disabled components",()=>{
  const model={
    unitScaleToMeters:1,
    components:[
      {
        id:"az",name:"Azimuth",transform:null,
        metadata:{semantic:{role:"thruster",subtype:"azimuth",subsystem:"propulsion",tags:["stern"],thruster:{thrust:12000,azimuthDeg:90,diameter:1.1}}}
      },
      {
        id:"off",name:"Disabled",transform:null,
        metadata:{semantic:{role:"thruster",subtype:"tunnel",thruster:{thrust:5000,axis:[0,1,0],enabled:false}}}
      }
    ]
  };
  const thrusters=thrustersFromModelDocument(model);
  assert.equal(thrusters.length,1);
  assert.equal(thrusters[0].type,"azimuth");
  assert.equal(thrusters[0].subsystem,"propulsion");
  assert.deepEqual(thrusters[0].tags,["stern"]);
  near(thrusters[0].axis[0],0,1e-12);
  near(thrusters[0].axis[1],1,1e-12);
});


test("azimuth direction is resolved locally before component world rotation",()=>{
  // 90 deg rotation about +Z: local +Y becomes world -X.
  const rotateZ90=[
    0,1,0,0,
    -1,0,0,0,
    0,0,1,0,
    0,0,0,1
  ];
  const model={
    unitScaleToMeters:1,
    components:[{
      id:"az-rot",name:"Rotated azimuth",transform:rotateZ90,
      metadata:{semantic:{
        role:"thruster",subtype:"azimuth",
        thruster:{thrust:10000,azimuthDeg:90}
      }}
    }]
  };
  const [thruster]=thrustersFromModelDocument(model);
  near(thruster.axis[0],-1,1e-12);
  near(thruster.axis[1],0,1e-12);
  assert.equal(thruster.azimuthDeg,null);

  const system=analyzeThrusterSystem([thruster]);
  near(system.totalForce[0],-10000,1e-8);
  near(system.totalForce[1],0,1e-8);
});
