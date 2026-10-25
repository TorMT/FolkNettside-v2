import test from "node:test";
import assert from "node:assert/strict";
import {convertCoolPropInputUnit,convertCoolPropInputRows,convertCoolPropDraftUnits,
  inputToSI,courseTableDefaultRows,DEFAULT_UNITS} from "../src/tools/coolprop-core.js";

const old={...DEFAULT_UNITS};
const next={pressure:"kPa",temperature:"K",energy:"Jkg",entropy:"JkgK"};
const approx=(actual,expected)=>assert.ok(Math.abs(actual-expected)<Math.max(1,Math.abs(expected))*1e-8,
  `Expected ${actual} close to ${expected}`);

test("unit change preserves raw SI physical values for pressure, temperature, enthalpy and entropy",()=>{
  for(const [key,value] of [["P",1.25],["T",-20],["H",520],["U",180],["S",2.9],["Q",.75],["D",1000]]){
    const changed=convertCoolPropInputUnit(key,value,old,next);
    approx(inputToSI(key,changed,next),inputToSI(key,value,old));
  }
  assert.equal(convertCoolPropInputUnit("P","",old,next),"");
  assert.equal(convertCoolPropInputUnit("P","incomplete",old,next),"incomplete");
  assert.equal(convertCoolPropInputUnit("P",null,old,next),null);
});

test("batch and reference input grids keep row ordering and do not repair invalid drafts",()=>{
  assert.equal(convertCoolPropInputRows("25,1\n100;3\ninvalid\n\n200,8",["T","P"],old,next),
    "298.15,100\n373.15,300\ninvalid\n\n473.15,800");
  assert.equal(convertCoolPropInputRows("1 300\n3,400",["P","H"],old,next),
    "100,300000\n300,400000");
  assert.equal(convertCoolPropInputRows("1\n3\n10",["P"],old,next),"100\n300\n1000");
});

test("complete draft converts every mode including process targets and preserves ideal gas K-only inputs",()=>{
  const original={
    units:old,fluid:"Air",
    single:{input1:"P",value1:"1",input2:"T",value2:"25"},
    explore:{input1:"H",value1:"300",input2:"S",value2:"1.5"},
    batch:{mode:"multi",format:"PH",rows:"1,300\n3,400"},
    process:{
      start:{input1:"P",value1:"1.5",input2:"T",value2:"100"},
      steps:[
        {targetType:"T",targetValue:"80"},{targetType:"P",targetValue:"2"},
        {targetType:"H",targetValue:"500"},{targetType:"Q",targetValue:"0.2"}
      ]},
    reference:{tableId:"A-22",rows:"300\n400\n1000"}
  };
  const changed=convertCoolPropDraftUnits(original,next);
  assert.equal(changed.single.value1,100);
  approx(changed.single.value2,298.15);
  assert.equal(changed.explore.value1,300000);
  assert.equal(changed.explore.value2,1500);
  assert.equal(changed.batch.rows,"100,300000\n300,400000");
  approx(changed.process.start.value2,373.15);
  assert.deepEqual(changed.process.steps.map(x=>x.targetValue),[353.15,200,500000,.2]);
  assert.equal(changed.reference.rows,original.reference.rows,"A-22 temperature stays Kelvin");
  assert.equal(original.single.value1,"1","source draft was mutated");
});

test("ammonia, water and unmapped native reference formats convert fluid-specific preset values",()=>{
  for(const [fluid,tableId,expected] of [
    ["Ammonia","A-13","233.15\n253.15\n273.15\n293.15"],
    ["Water","A-3","50\n100\n500\n1000"],
    ["Propane","Native-TP","273.15,100\n298.15,100\n373.15,500\n473.15,1000"]
  ]){
    const draft={fluid,units:old,reference:{tableId,rows:courseTableDefaultRows(fluid,tableId,old)}};
    const changed=convertCoolPropDraftUnits(draft,next);
    if(fluid==="Water"){
      const values=changed.reference.rows.split("\n");
      assert.equal(values[0],"50");
      continue;
    }
    assert.equal(changed.reference.rows,expected,fluid);
  }
});
