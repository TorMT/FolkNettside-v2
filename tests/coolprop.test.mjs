import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_UNITS,PROCESS_TYPES,applyBookBasis,batchFormat,computeBatch,computeProcess,
  computeState,inputToSI,outputFromSI,parseBatchRows,phaseDescription,saturationWarning,
  processTargetOptions,rowsToCSV,rowsToJSON,unitLabel
} from "../src/tools/coolprop-core.js";

function fakeEngine(){
  const calls=[];
  const engine={
    calls,
    propsSI(out,k1,v1,k2,v2,fluid){
      calls.push([out,k1,v1,k2,v2,fluid]);
      if(out===k1)return v1;
      if(out===k2)return v2;
      const seed=(Number(v1)||0)+(Number(v2)||0);
      const base={
        T:300,
        P:2e5,
        D:1.2,
        H:300000,
        S:7000,
        U:250000,
        Cp:1000,
        Cv:700,
        viscosity:1.8e-5,
        conductivity:.026,
        speed_sound:343,
        Prandtl:.7,
        Q:-1
      };
      return base[out]??seed;
    },
    phaseSI(){return "gas"}
  };
  return engine;
}

test("CoolProp unit conversions preserve legacy unit choices",()=>{
  assert.equal(inputToSI("P",1,{pressure:"bar"}),100000);
  assert.equal(inputToSI("P",250,{pressure:"kPa"}),250000);
  assert.equal(inputToSI("P",2.5,{pressure:"MPa"}),2500000);
  assert.equal(inputToSI("P",250000,{pressure:"Pa"}),250000);
  assert.ok(Math.abs(inputToSI("T",25,{temperature:"C"})-298.15)<1e-12);
  assert.equal(inputToSI("T",300,{temperature:"K"}),300);
  assert.equal(inputToSI("H",500,{energy:"kJkg"}),500000);
  assert.equal(inputToSI("H",500000,{energy:"Jkg"}),500000);
  assert.equal(outputFromSI("P",250000,{pressure:"bar"}),2.5);
  assert.ok(Math.abs(outputFromSI("T",300,{temperature:"C"})-26.85)<1e-10);
  assert.equal(unitLabel("S",{entropy:"kJkgK"}),"kJ/(kg·K)");
});

test("state calculator delegates SI inputs and converts outputs",()=>{
  const engine=fakeEngine();
  const result=computeState(engine,{fluid:"Air",input1:"P",value1:1,input2:"T",value2:25});
  assert.equal(engine.calls[0][2],100000);
  assert.ok(Math.abs(engine.calls[0][4]-298.15)<1e-12);
  assert.equal(result.values.H,300);
  assert.equal(result.values.P,1);
  assert.equal(result.phase,"Gas / superheated vapour");
  assert.equal(result.valuesSI.H,300000);
});

test("duplicate independent variables are rejected",()=>{
  assert.throws(()=>computeState(fakeEngine(),{fluid:"Air",input1:"P",value1:1,input2:"P",value2:2}),/different independent/);
});

test("phase descriptions are stable",()=>{
  assert.equal(phaseDescription("twophase"),"Two-phase");
  assert.equal(phaseDescription("supercritical_gas"),"Supercritical");
});

test("book basis reproduces legacy Air calibration behavior",()=>{
  const engine=fakeEngine();
  const raw=300000;
  const adjusted=applyBookBasis(engine,"Air","H",raw,true);
  const calibrationCall=engine.calls.find(call=>call[0]==="H"&&call[1]==="T"&&call[2]===1000);
  assert.ok(calibrationCall);
  assert.notEqual(adjusted,raw);
  assert.equal(applyBookBasis(engine,"Water","H",raw,true),raw);
  assert.equal(applyBookBasis(engine,"Air","S",7000,true),7000);
});

test("batch formats and row parsing match legacy modes",()=>{
  assert.deepEqual(batchFormat("TP"),["T","P"]);
  assert.deepEqual(batchFormat("PH"),["P","H"]);
  assert.equal(batchFormat("bad"),null);
  const rows=parseBatchRows("25,1\n100 5\nbad");
  assert.equal(rows.length,3);
  assert.equal(rows[0].status,"OK");
  assert.equal(rows[2].status,"FAIL");
});

test("batch multi-output returns requested fields and preserves failed rows",()=>{
  const rows=computeBatch(fakeEngine(),{
    fluid:"Air",
    format:"TP",
    rows:"25,1\n100,5\ninvalid",
    outputs:["H","S","Phase"]
  });
  assert.equal(rows.length,3);
  assert.equal(rows[0].status,"OK");
  assert.equal(rows[0].values.H,300);
  assert.equal(rows[0].values.Phase,"Gas / superheated vapour");
  assert.equal(rows[2].status,"FAIL");
});

test("all five legacy process types preserve the prior constant property",()=>{
  const scenarios=[
    ["isobaric","T","P"],
    ["isothermal","P","T"],
    ["isentropic","P","S"],
    ["isochoric","T","D"],
    ["isenthalpic","P","H"]
  ];
  for(const [processType,targetType,constant] of scenarios){
    const engine=fakeEngine();
    const rows=computeProcess(engine,{
      fluid:"Air",
      start:{input1:"P",value1:1,input2:"T",value2:25,description:"Start"},
      steps:[{processType,targetType,targetValue:targetType==="T"?100:2,description:"Step"}]
    });
    assert.equal(rows.length,2);
    assert.equal(rows[1].status,"OK",processType);
    const processCall=engine.calls.find(call=>call[1]===constant&&call[3]===targetType);
    assert.ok(processCall,`missing ${processType} call with ${constant}=const`);
  }
});

test("process target options match legacy UI constraints",()=>{
  assert.deepEqual(processTargetOptions("isobaric"),["T","H","S","Q","D"]);
  assert.deepEqual(processTargetOptions("isenthalpic"),["P","T","S","Q"]);
  assert.deepEqual(processTargetOptions("missing"),[]);
  assert.equal(Object.keys(PROCESS_TYPES).length,5);
});

test("CSV and JSON exports serialize result rows",()=>{
  const rows=[{Step:1,Description:"Start",P:1},{Step:2,Description:"Heat, stage",P:1}];
  const csv=rowsToCSV(rows);
  assert.match(csv,/Step,Description,P/);
  assert.match(csv,/"Heat, stage"/);
  assert.deepEqual(JSON.parse(rowsToJSON(rows)),rows);
});

test("default units remain the legacy-friendly display defaults",()=>{
  assert.deepEqual(DEFAULT_UNITS,{pressure:"bar",temperature:"C",energy:"kJkg",entropy:"kJkgK"});
});


test("P-T states near saturation preserve the legacy two-phase warning",()=>{
  const engine={
    propsSI(out,k1,v1,k2,v2){
      if(out==="T"&&k1==="P"&&k2==="Q")return 373.15;
      return 0;
    }
  };
  const critical=saturationWarning(engine,{fluid:"Water",input1:"P",value1:1,input2:"T",value2:100});
  assert.equal(critical.severity,"critical");
  assert.ok(critical.deltaK<.5);

  const near=saturationWarning(engine,{fluid:"Water",input1:"T",value1:103,input2:"P",value2:1});
  assert.equal(near.severity,"warning");

  const far=saturationWarning(engine,{fluid:"Water",input1:"P",value1:1,input2:"T",value2:120});
  assert.equal(far,null);
});

test("saturation warning only applies to a P-T input pair",()=>{
  const engine={propsSI(){throw new Error("should not be called")}};
  assert.equal(saturationWarning(engine,{fluid:"Water",input1:"P",value1:1,input2:"H",value2:400}),null);
});
