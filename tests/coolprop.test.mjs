import test from "node:test";
import assert from "node:assert/strict";
import {computeState,inputToSI,outputFromSI,phaseDescription} from "../src/tools/coolprop-core.js";

test("CoolProp unit conversions use engineering display units",()=>{
  assert.equal(inputToSI("P",1),100000);
  assert.ok(Math.abs(inputToSI("T",25)-298.15)<1e-12);
  assert.equal(inputToSI("H",500),500000);
  assert.equal(outputFromSI("P",250000),2.5);
  assert.ok(Math.abs(outputFromSI("T",300)-26.85)<1e-10);
});

test("state calculator delegates SI inputs and converts outputs",()=>{
  const calls=[];
  const engine={
    propsSI(out,k1,v1,k2,v2,fluid){
      calls.push([out,k1,v1,k2,v2,fluid]);
      const values={T:300,P:1e5,D:1.2,H:300000,S:7000,U:250000,Cp:1000,Cv:700,viscosity:1.8e-5,conductivity:.026,speed_sound:343,Prandtl:.7,Q:-1};
      return values[out];
    },
    phaseSI(){return "gas"}
  };
  const result=computeState(engine,{fluid:"Air",input1:"P",value1:1,input2:"T",value2:25});
  assert.equal(calls[0][2],100000);
  assert.ok(Math.abs(calls[0][4]-298.15)<1e-12);
  assert.equal(result.values.H,300);
  assert.equal(result.values.P,1);
  assert.equal(result.phase,"Gas / superheated vapour");
});

test("duplicate independent variables are rejected",()=>{
  assert.throws(()=>computeState({propsSI(){}},{fluid:"Air",input1:"P",value1:1,input2:"P",value2:2}),/different independent/);
});

test("phase descriptions are stable",()=>{
  assert.equal(phaseDescription("twophase"),"Two-phase");
  assert.equal(phaseDescription("supercritical_gas"),"Supercritical");
});
