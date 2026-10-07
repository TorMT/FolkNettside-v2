import test from "node:test";
import assert from "node:assert/strict";
import {
  COOLPROP_OUTPUT_ALIASES,COOLPROP_PHASE_INDEX,COURSE_TABLE_CONFIGS,COURSE_TABLE_LABELS,DEFAULT_FLUIDS,DEFAULT_UNITS,PROCESS_TYPES,TABLE4_PRESETS,TABLE4_R_SPEC,TABLE_REFERENCE_PROFILES,
  applyBookBasis,batchFormat,computeBatch,computeCourseReferenceTable,computeProcess,computeTable4,computeState,courseTableConfig,courseTableLabel,inputToSI,outputFromSI,
  parseBatchRows,phaseDescription,propsSIOutput,removeBookBasis,saturationWarning,tableReferenceOffsets,tableReferenceProfile,
  processTargetOptions,rowsToCSV,rowsToJSON,unitLabel,verifyTableReference
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
  assert.equal(phaseDescription("supercritical_gas"),"Supercritical gas");
  assert.equal(phaseDescription("supercritical_liquid"),"Supercritical liquid");
  assert.equal(phaseDescription("gas"),"Gas / superheated vapour");
  assert.equal(phaseDescription("liquid"),"Liquid / subcooled");
  assert.equal(phaseDescription(4),"Critical point");
  assert.equal(phaseDescription(5),"Gas / superheated vapour");
  assert.equal(phaseDescription(6),"Two-phase");
  assert.equal(phaseDescription(7),"Unknown");
  assert.equal(COOLPROP_PHASE_INDEX[0],"liquid");
});

test("phase falls back to PropsSI Phase index when PhaseSI is unavailable",()=>{
  const base=fakeEngine();
  delete base.phaseSI;
  const original=base.propsSI;
  base.propsSI=(out,...args)=>out==="Phase"?5:original(out,...args);
  const result=computeState(base,{fluid:"Water",input1:"P",value1:1,input2:"T",value2:120});
  assert.equal(result.phase,"Gas / superheated vapour");
  assert.equal(result.phaseRaw,5);
});

test("table basis calibrates Air H U and S and round-trips engine values",()=>{
  const engine=fakeEngine();
  const rawH=300000,rawS=7000;
  const adjustedH=applyBookBasis(engine,"Air","H",rawH,true);
  const adjustedS=applyBookBasis(engine,"Air","S",rawS,true);
  const offsets=tableReferenceOffsets(engine,"Air");
  assert.equal(adjustedH,TABLE_REFERENCE_PROFILES.Air.calibration.H);
  assert.equal(adjustedS,TABLE_REFERENCE_PROFILES.Air.calibration.S);
  assert.equal(removeBookBasis(engine,"Air","H",adjustedH,true),rawH);
  assert.equal(removeBookBasis(engine,"Air","S",adjustedS,true),rawS);
  assert.ok(Number.isFinite(offsets.H));
  assert.ok(Number.isFinite(offsets.U));
  assert.ok(Number.isFinite(offsets.S));
  assert.equal(applyBookBasis(engine,"Water","H",rawH,true),rawH);
});

test("PH and PU inputs are converted from table basis back to CoolProp basis",()=>{
  const engineH=fakeEngine();
  computeState(engineH,{
    fluid:"Air",input1:"P",value1:1,input2:"H",value2:1046.04,bookBasis:true
  });
  assert.ok(engineH.calls.some(call=>
    call[1]==="P"&&call[2]===100000&&call[3]==="H"&&Math.abs(call[4]-300000)<1e-9
  ));

  const engineU=fakeEngine();
  computeState(engineU,{
    fluid:"Air",input1:"P",value1:1,input2:"U",value2:758.94,bookBasis:true
  });
  assert.ok(engineU.calls.some(call=>
    call[1]==="P"&&call[2]===100000&&call[3]==="U"&&Math.abs(call[4]-250000)<1e-9
  ));
});

test("process constants use raw engine basis when table conversion is enabled",()=>{
  const engine=fakeEngine();
  const rows=computeProcess(engine,{
    fluid:"Air",
    bookBasis:true,
    start:{input1:"P",value1:1,input2:"T",value2:25},
    steps:[
      {processType:"isenthalpic",targetType:"P",targetValue:2},
      {processType:"isentropic",targetType:"P",targetValue:3}
    ]
  });
  assert.equal(rows[1].status,"OK");
  assert.ok(engine.calls.some(call=>call[1]==="H"&&Math.abs(call[2]-300000)<1e-9));
});

test("Table A-22 fixture includes course reference values and diagnostic checkpoints",()=>{
  const calibrationProfile=TABLE_REFERENCE_PROFILES.Air.calibration;
  assert.equal(calibrationProfile.T,1000);
  assert.equal(calibrationProfile.P,1e5);
  assert.equal(calibrationProfile.H,1046.04e3);
  assert.equal(calibrationProfile.U,758.94e3);
  assert.equal(calibrationProfile.S,2.96770e3);
  assert.deepEqual(calibrationProfile.inputs,["T",1000,"P",1e5]);
  assert.deepEqual(
    TABLE_REFERENCE_PROFILES.Air.checkpoints.map(point=>point.T),
    [300,400,1000,1200]
  );
  const report=verifyTableReference(fakeEngine(),"Air");
  const calibration=report.find(point=>point.T===1000);
  assert.equal(calibration.values.H,1046.04e3);
  assert.equal(calibration.values.U,758.94e3);
  assert.equal(calibration.values.S,2.96770e3);
  assert.deepEqual(calibration.errors,{H:0,U:0,S:0});
});

test("course table labels and profiles follow the selected working fluid",()=>{
  assert.equal(courseTableLabel("Air"),"Air · Table A-22");
  assert.equal(courseTableLabel("Ammonia"),"Ammonia · Tables A-13 / A-14 / A-15");
  assert.equal(courseTableLabel("Water"),"Water · Tables A-2 / A-3 / A-4 / A-5");
  assert.equal(courseTableLabel("Propane"),"Propane · native CoolProp basis");
  assert.equal(tableReferenceProfile("Air"),TABLE_REFERENCE_PROFILES.Air);
  assert.equal(tableReferenceProfile("Ammonia"),TABLE_REFERENCE_PROFILES.Ammonia);
  assert.equal(tableReferenceProfile("Water"),null);
  assert.equal(COURSE_TABLE_LABELS.Ammonia,"Ammonia · Tables A-13 / A-14 / A-15");
});

test("Ammonia table basis calibrates H U and S to Table A-15 reference",()=>{
  const engine=fakeEngine();
  const profile=TABLE_REFERENCE_PROFILES.Ammonia;
  const offsets=tableReferenceOffsets(engine,"Ammonia");
  assert.ok(Number.isFinite(offsets.H));
  assert.ok(Number.isFinite(offsets.U));
  assert.ok(Number.isFinite(offsets.S));

  const rawH=300000,rawU=250000,rawS=7000;
  assert.equal(applyBookBasis(engine,"Ammonia","H",rawH,true),profile.calibration.H);
  assert.equal(applyBookBasis(engine,"Ammonia","U",rawU,true),profile.calibration.U);
  assert.equal(applyBookBasis(engine,"Ammonia","S",rawS,true),profile.calibration.S);
  assert.equal(removeBookBasis(engine,"Ammonia","H",profile.calibration.H,true),rawH);
  assert.equal(removeBookBasis(engine,"Ammonia","U",profile.calibration.U,true),rawU);
  assert.equal(removeBookBasis(engine,"Ammonia","S",profile.calibration.S,true),rawS);
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


test("legacy Table 4 constants match the old calculator exactly",()=>{
  assert.deepEqual(TABLE4_R_SPEC,{
    Air:287.058,
    Water:461.526,
    Nitrogen:296.803,
    CO2:188.924,
    CarbonDioxide:188.924
  });
});

test("Table 4 reproduces legacy ideal-vs-real specific volume math",()=>{
  const engine={
    propsSI(out,k1,T,k2,P,fluid){
      assert.equal(out,"D");
      assert.equal(k1,"T");
      assert.equal(k2,"P");
      assert.equal(fluid,"Air");
      return 1.2;
    }
  };
  const [row]=computeTable4(engine,{
    fluid:"Air",
    format:"TP",
    rows:"25,1",
    units:{pressure:"bar",temperature:"C",energy:"kJkg",entropy:"kJkgK"}
  });
  const T=298.15,P=1e5,R=287.058;
  const vIdeal=R*T/P;
  const vReal=1/1.2;
  assert.equal(row.status,"OK");
  assert.ok(Math.abs(row.vIdeal-vIdeal)<1e-12);
  assert.ok(Math.abs(row.vReal-vReal)<1e-12);
  assert.ok(Math.abs(row.Z-vReal/vIdeal)<1e-12);
  assert.ok(Math.abs(row.diffPercent-Math.abs(vReal-vIdeal)/vIdeal*100)<1e-12);
});

test("Table 4 supports PT ordering and rejects unsupported legacy fluids",()=>{
  const engine={propsSI(){return 2}};
  const [row]=computeTable4(engine,{fluid:"Nitrogen",format:"PT",rows:"1,25"});
  assert.equal(row.status,"OK");
  assert.throws(()=>computeTable4(engine,{fluid:"Propane",format:"TP",rows:"25,1"}),/Missing legacy R_spec/);
});

test("Table 4 rejects PH and PU because legacy equation needs T and P",()=>{
  const engine={propsSI(){return 1}};
  assert.throws(()=>computeTable4(engine,{fluid:"Air",format:"PH",rows:"1,100"}),/requires T\/P/);
});


test("Table 4 presets reproduce the legacy calibration points",()=>{
  assert.equal(TABLE4_PRESETS.Air.fluid,"Air");
  assert.equal(TABLE4_PRESETS.Air.format,"TP");
  assert.match(TABLE4_PRESETS.Air.rows,/25,1/);
  assert.match(TABLE4_PRESETS.Air.rows,/390,40/);
  assert.equal(TABLE4_PRESETS.Water.fluid,"Water");
  assert.match(TABLE4_PRESETS.Water.rows,/90,0\.5/);
  assert.match(TABLE4_PRESETS.Water.rows,/880,300/);
  assert.deepEqual(TABLE4_PRESETS.Air.units,{pressure:"bar",temperature:"C"});
});


test("CoolProp output aliases fall back to canonical WASM keys",()=>{
  const calls=[];
  const engine={
    propsSI(key){
      calls.push(key);
      if(key==="Cp")throw new Error("unknown output");
      if(key==="Cpmass")return 1005;
      throw new Error("unexpected");
    }
  };
  const result=propsSIOutput(engine,"Cp","P",1e5,"T",298.15,"Air");
  assert.equal(result.value,1005);
  assert.equal(result.key,"Cpmass");
  assert.deepEqual(calls,["Cp","Cpmass"]);
});

test("CoolProp output aliases skip non-finite primary values",()=>{
  const engine={
    propsSI(key){
      if(key==="speed_sound")return NaN;
      if(key==="speed_of_sound")return 343;
      throw new Error("unexpected");
    }
  };
  const result=propsSIOutput(engine,"speed_sound","P",1e5,"T",298.15,"Air");
  assert.equal(result.value,343);
  assert.equal(result.key,"speed_of_sound");
});

test("known alias sets include mass heat capacities and speed of sound",()=>{
  assert.ok(COOLPROP_OUTPUT_ALIASES.Cp.includes("Cpmass"));
  assert.ok(COOLPROP_OUTPUT_ALIASES.Cv.includes("Cvmass"));
  assert.ok(COOLPROP_OUTPUT_ALIASES.speed_sound.includes("A"));
});


test("full legacy CoolProp working-fluid set is available in v2",()=>{
  for(const fluid of ["Air","Nitrogen","Water","CO2","Oxygen","Helium","Methane","Propane","Ammonia","R134a"]){
    assert.ok(DEFAULT_FLUIDS.includes(fluid),fluid);
  }
});

test("course table configurations retain distinct saturation and superheated tables",()=>{
  assert.deepEqual(COURSE_TABLE_CONFIGS.Water.tables.map(t=>t.id),["A-2","A-3","A-4","A-5"]);
  assert.deepEqual(COURSE_TABLE_CONFIGS.Ammonia.tables.map(t=>t.id),["A-13","A-14","A-15"]);
  assert.deepEqual(COURSE_TABLE_CONFIGS.R134a.tables.map(t=>t.id),["A-10","A-11","A-12"]);
  assert.equal(courseTableConfig("Water").tables.find(t=>t.id==="A-5").mode,"compressed");
  assert.equal(courseTableConfig("Propane"),null);
});


test("course saturation-table generator returns liquid and vapour columns",()=>{
  const engine={
    propsSI(out,k1,v1,k2,v2){
      const q=k1==="Q"?v1:k2==="Q"?v2:0;
      if(out==="P")return 2e5;
      if(out==="T")return 300;
      if(out==="D")return q===0?1000:2;
      if(out==="U")return (100+q*2000)*1000;
      if(out==="H")return (120+q*2200)*1000;
      if(out==="S")return (0.4+q*7)*1000;
      return 0;
    }
  };
  const [row]=computeCourseReferenceTable(engine,{
    fluid:"Water",tableId:"A-2",rows:"25",
    units:{pressure:"bar",temperature:"C",energy:"kJkg",entropy:"kJkgK"}
  });
  assert.equal(row.Status,"OK");
  assert.equal(row.T,25);
  assert.equal(row.P,2);
  assert.equal(row.vf,.001);
  assert.equal(row.vg,.5);
  assert.equal(row.hf,120);
  assert.equal(row.hg,2320);
});

test("superheated course table generator accepts T,P rows",()=>{
  const [row]=computeCourseReferenceTable(fakeEngine(),{
    fluid:"Ammonia",tableId:"A-15",rows:"100,5",
    units:{pressure:"bar",temperature:"C",energy:"kJkg",entropy:"kJkgK"}
  });
  assert.equal(row.Status,"OK");
  assert.equal(row.T,26.85);
  assert.equal(row.P,2);
  assert.equal(row.H,300);
  assert.equal(row.Phase,"Gas / superheated vapour");
});
