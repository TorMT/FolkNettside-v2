import assert from "node:assert/strict";
import {copyFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

import {dataBounds,diagramDatasets} from "../src/tools/coolprop-diagram-core.js";
import {
  IAPWS_IF97_INDEPENDENT_CASES,IAPWS_IF97_SATURATION_CASES,IAPWS_IF97_LIMITS
} from "../tests/fixtures/coolprop-iapws-if97-reference.mjs";
import {
  TABLE_REFERENCE_PROFILES,
  applyBookBasis,
  phaseDescription,
  removeBookBasis,
  verifyTableReference,computeCourseReferenceTable,courseTableConfig,
  courseTableDefaultRows,courseCalibrationSummary,propsSIOutput,computeState
} from "../src/tools/coolprop-core.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const vendor=path.join(root,"src","vendor","coolprop");
const scratch=mkdtempSync(path.join(tmpdir(),"folk-coolprop-"));

function closeEnough(actual,expected,tolerance,label){
  const error=Math.abs(actual-expected);
  assert.ok(Number.isFinite(actual),label+" is not finite");
  assert.ok(error<=tolerance,`${label}: ${actual} differs from ${expected} by ${error}, tolerance ${tolerance}`);
}

async function loadRuntime(){
  const js=path.join(scratch,"coolprop.cjs");
  copyFileSync(path.join(vendor,"coolprop.js"),js);
  copyFileSync(path.join(vendor,"coolprop.wasm"),path.join(scratch,"coolprop.wasm"));
  const require=createRequire(import.meta.url);
  const Module=require(js);
  const deadline=Date.now()+15000;
  while(typeof Module?.PropsSI!=="function"&&Date.now()<deadline){
    await new Promise(resolve=>setTimeout(resolve,25));
  }
  if(typeof Module?.PropsSI!=="function")throw new Error("CoolProp Node runtime did not initialize");
  return {
    propsSI:Module.PropsSI.bind(Module),
    props1SI:typeof Module.Props1SI==="function"?Module.Props1SI.bind(Module):null,
    phaseSI:typeof Module.PhaseSI==="function"?Module.PhaseSI.bind(Module):null
  };
}

try{
  const engine=await loadRuntime();
  const profile=TABLE_REFERENCE_PROFILES.Air;
  const report=verifyTableReference(engine,"Air");

  console.log("\nAir Table A-22 reference verification at 1 bar");
  console.log("T[K]       H adjusted / book [kJ/kg]       U adjusted / book [kJ/kg]       S adjusted / book [kJ/kgK]");
  for(const row of report){
    const h=row.values.H/1000,u=row.values.U/1000,s=row.values.S/1000;
    console.log(
      String(row.T).padStart(4),
      `${h.toFixed(5)} / ${(row.H/1000).toFixed(5)}`.padStart(27),
      `${u.toFixed(5)} / ${(row.U/1000).toFixed(5)}`.padStart(31),
      `${s.toFixed(6)} / ${(row.S/1000).toFixed(6)}`.padStart(32)
    );

    // A reference-state conversion should preserve the CoolProp model while
    // keeping it close to the course ideal-gas table over the teaching range.
    assert.ok(Math.abs(row.errors.H)<=500,`Air A-22 H mismatch at ${row.T} K: ${row.errors.H} J/kg`);
    assert.ok(Math.abs(row.errors.U)<=500,`Air A-22 U mismatch at ${row.T} K: ${row.errors.U} J/kg`);
    assert.ok(Math.abs(row.errors.S)<=1.2,`Air A-22 S mismatch at ${row.T} K: ${row.errors.S} J/(kg K)`);
  }

  const calibration=report.find(row=>row.T===profile.calibration.T);
  closeEnough(calibration.values.H,profile.calibration.H,1e-6,"Air A-22 calibration H");
  closeEnough(calibration.values.U,profile.calibration.U,1e-6,"Air A-22 calibration U");
  closeEnough(calibration.values.S,profile.calibration.S,1e-9,"Air A-22 calibration S");

  const rawH=removeBookBasis(engine,"Air","H",profile.calibration.H,true);
  const inverseT=engine.propsSI("T","P",profile.calibration.P,"H",rawH,"Air");
  closeEnough(inverseT,1000,1e-5,"Air inverse P-H temperature");

  const rawAtCalibration=engine.propsSI("H","T",1000,"P",1e5,"Air");
  closeEnough(applyBookBasis(engine,"Air","H",rawAtCalibration,true),profile.calibration.H,1e-6,"Air forward H conversion");

  const ammoniaProfile=TABLE_REFERENCE_PROFILES.Ammonia;
  const ammoniaReport=verifyTableReference(engine,"Ammonia");
  console.log("\nAmmonia A-13/A-14/A-15 reference verification");
  console.log("state                         dH [J/kg]      dU [J/kg]      dS [J/(kg K)]");
  for(const row of ammoniaReport){
    const label=row.Q===1
      ?`T=${row.T} K, saturated vapour`
      :`T=${row.T} K, P=${(row.P/1e5).toFixed(2)} bar`;
    for(const prop of ["H","U","S"]){
      assert.ok(Number.isFinite(row.values[prop]),`Ammonia ${prop} is not finite at ${label}`);
    }
    assert.ok(Math.abs(row.errors.H)<=500,`Ammonia table H mismatch at ${label}: ${row.errors.H} J/kg`);
    assert.ok(Math.abs(row.errors.U)<=500,`Ammonia table U mismatch at ${label}: ${row.errors.U} J/kg`);
    assert.ok(Math.abs(row.errors.S)<=2,`Ammonia table S mismatch at ${label}: ${row.errors.S} J/(kg K)`);
    console.log(
      label.padEnd(29),
      row.errors.H.toFixed(2).padStart(12),
      row.errors.U.toFixed(2).padStart(14),
      row.errors.S.toFixed(4).padStart(18)
    );
  }
  const ammoniaCalibration=ammoniaReport[0];
  closeEnough(ammoniaCalibration.values.H,ammoniaProfile.calibration.H,1e-6,"Ammonia A-15 calibration H");
  closeEnough(ammoniaCalibration.values.U,ammoniaProfile.calibration.U,1e-6,"Ammonia A-15 calibration U");
  closeEnough(ammoniaCalibration.values.S,ammoniaProfile.calibration.S,1e-9,"Ammonia A-15 calibration S");
  const ammoniaRawH=removeBookBasis(engine,"Ammonia","H",ammoniaProfile.calibration.H,true);
  const ammoniaInverseT=engine.propsSI("T","P",ammoniaProfile.calibration.P,"H",ammoniaRawH,"Ammonia");
  closeEnough(ammoniaInverseT,ammoniaProfile.calibration.T,2e-4,"Ammonia inverse P-H temperature");

  const waterTsat=engine.propsSI("T","P",101325,"Q",0,"Water");
  closeEnough(waterTsat,373.1242958477,0.01,"Water saturation temperature at 1 atm");
  const waterPhase=phaseDescription(engine.phaseSI?.("P",1e5,"T",393.15,"Water")??engine.propsSI("Phase","P",1e5,"T",393.15,"Water"));
  assert.equal(waterPhase,"Gas / superheated vapour");

  const r134aP=engine.propsSI("P","T",273.15,"Q",0.5,"R134a");
  const r134aH=engine.propsSI("H","T",273.15,"Q",0.5,"R134a");
  closeEnough(r134aP,292803,150,"R134a saturation pressure at 0 C");
  closeEnough(r134aH,299301.72,100,"R134a h at 0 C, Q=0.5");
  const r134aPhase=phaseDescription(engine.phaseSI?.("T",273.15,"Q",0.5,"R134a")??engine.propsSI("Phase","T",273.15,"Q",0.5,"R134a"));
  assert.equal(r134aPhase,"Two-phase");

  console.log("\nRepresentative phase/saturation checks");
  console.log(`Water Tsat @ 1 atm: ${waterTsat.toFixed(8)} K`);
  console.log(`Water @ 1 bar, 120 C: ${waterPhase}`);
  console.log(`R134a @ 0 C, Q=0.5: P=${(r134aP/1e5).toFixed(5)} bar, H=${(r134aH/1000).toFixed(5)} kJ/kg, phase=${r134aPhase}`);

  console.log("\nDiagram generation checks");
  for(const fluid of ["Water","Ammonia","R134a"]){
    const state={
      valuesSI:{
        T:engine.propsSI("T","P",2e5,"Q",1,fluid),
        P:2e5,
        H:engine.propsSI("H","P",2e5,"Q",1,fluid),
        S:engine.propsSI("S","P",2e5,"Q",1,fluid),
        D:engine.propsSI("D","P",2e5,"Q",1,fluid)
      }
    };
    for(const type of ["log-ph","ph","ts","pv"]){
      const datasets=diagramDatasets(engine,fluid,type,[state],{
        quality:true,isotherms:true,isobars:true,
        bookBasis:Boolean(TABLE_REFERENCE_PROFILES[fluid])
      });
      const bounds=dataBounds(datasets,{logY:type==="log-ph"||type==="pv"});
      assert.ok(datasets.some(dataset=>dataset.kind==="saturation"&&dataset.points.length>20),`${fluid} ${type} saturation curve missing`);
      assert.ok(datasets.some(dataset=>dataset.kind==="states"&&dataset.points.length===1),`${fluid} ${type} state point missing`);
      for(const value of Object.values(bounds))assert.ok(Number.isFinite(value),`${fluid} ${type} has invalid bounds`);
      assert.ok(bounds.xmax>bounds.xmin&&bounds.ymax>bounds.ymin,`${fluid} ${type} bounds are inverted`);
      console.log(`${fluid.padEnd(8)} ${type.padEnd(6)} datasets=${String(datasets.length).padStart(2)} bounds OK`);
    }
  }

  console.log("\nCourse/native reference table generation matrix");
  const matrix={
    Water:["A-2","A-3","A-4","A-5"],
    Ammonia:["A-13","A-14","A-15"],
    R134a:["A-10","A-11","A-12"],
    Propane:["Native-TP","Native-sat-T","Native-sat-P","Native-vapour"],
    CO2:["Native-sat-T","Native-sat-P"],
    Methane:["Native-sat-T"],Oxygen:["Native-sat-T"],Nitrogen:["Native-sat-T"]
  };
  for(const [fluid,tableIds] of Object.entries(matrix)){
    for(const tableId of tableIds){
      assert.ok(courseTableConfig(fluid)?.tables?.some(table=>table.id===tableId));
      const defaults=courseTableDefaultRows(fluid,tableId);
      const rows=computeCourseReferenceTable(engine,{
        fluid,tableId,rows:defaults,bookBasis:Boolean(TABLE_REFERENCE_PROFILES[fluid])
      });
      assert.ok(rows.length>0,fluid+" "+tableId+" returned no rows");
      const failed=rows.filter(row=>row.Status!=="OK");
      assert.equal(failed.length,0,
        fluid+" "+tableId+" has failed reference presets: "+
        failed.map(row=>row.Row+":"+row.Error).join("; "));
      console.log(fluid.padEnd(9),tableId.padEnd(14),rows.length+" rows: OK");
    }
  }
  for(const fluid of ["Air","Ammonia"]){
    const audit=courseCalibrationSummary(engine,fluid);
    assert.equal(audit.status,"within-tolerance",fluid+" calibration not within verified limits");
    console.log(fluid+" calibration: "+audit.status+" ("+audit.rows.length+" checkpoints)");
  }
  for(const fluid of ["Water","R134a","CO2"]){
    assert.equal(courseCalibrationSummary(engine,fluid).status,"native-only",
      "Unverified textbook calibration must not be claimed for "+fluid);
  }
  console.log("\nIndependent IAPWS-IF97 water/steam verification (different EOS, 6 states / 3 saturation)");
  const comparePublished=(value,expected,key,label)=>{
    const rel=IAPWS_IF97_LIMITS.relative[key]||0;
    const abs=IAPWS_IF97_LIMITS.absolute[key]||0;
    const allowance=Math.max(abs,Math.abs(expected)*rel);
    closeEnough(value,expected,allowance,label+" against IF97");
    return Math.abs(value-expected)/Math.max(Math.abs(expected),1);
  };
  let largest=0,count=0;
  for(const sample of IAPWS_IF97_INDEPENDENT_CASES){
    const raw=(key)=>{
      if(key==="v")return 1/engine.propsSI("D","T",sample.T,"P",sample.P,"Water");
      return propsSIOutput(engine,key,"T",sample.T,"P",sample.P,"Water").value;
    };
    for(const [key,expected] of Object.entries(sample.expected)){
      const actual=raw(key);
      const deviation=comparePublished(actual,expected,key,sample.id+"/"+key);
      largest=Math.max(largest,deviation);
      count++;
    }
    // Verify that the *visible* Water A-4/A-5 course workspace uses the same
    // published dimensional basis, not just that native PropsSI looks correct.
    const tableId=sample.phase==="compressed-liquid"?"A-5":"A-4";
    const row=computeCourseReferenceTable(engine,{
      fluid:"Water",tableId,
      rows:`${(sample.T-273.15).toFixed(7)},${sample.P/1e5}`,
      bookBasis:false
    })[0];
    assert.equal(row.Status,"OK",sample.id+"/"+tableId+": "+row.Error);
    for(const key of ["v","H","U","S"]){
      const visible=key==="v"?row.v:row[key]*1000;
      // The UI's entropy unit default is kJ/(kg K), other U/H kJ/kg.
      comparePublished(visible,sample.expected[key],key,sample.id+"/"+tableId+"/"+key);
    }
    console.log(`  ${sample.id.padEnd(20)} ${tableId} ${sample.phase}`);
  }

  for(const sample of IAPWS_IF97_SATURATION_CASES){
    const pressure=engine.propsSI("P","T",sample.T,"Q",0,"Water");
    closeEnough(pressure,sample.expectedP,
      sample.expectedP*IAPWS_IF97_LIMITS.saturationRelative,sample.id+"/P");
    const row=computeCourseReferenceTable(engine,{
      fluid:"Water",tableId:"A-2",rows:String(sample.T-273.15),
      bookBasis:false
    })[0];
    assert.equal(row.Status,"OK",sample.id+"/A-2: "+row.Error);
    closeEnough(row.P*1e5,sample.expectedP,
      sample.expectedP*IAPWS_IF97_LIMITS.saturationRelative,sample.id+"/A-2/P");
    assert.ok(row.vg>row.vf&&row.hg>row.hf&&row.sg>row.sf,
      sample.id+": saturated vapor/liquid ordering reversed");
    count++;
    console.log(`  ${sample.id.padEnd(20)} A-2 saturation`);
  }

  // Teaching case: wet steam as a quality-weighted liquid/vapor mixture.
  // These are thermodynamic identity checks, NOT independent table references.
  for(const p of [1e5,5e5,1e6]){
    const x=0.35;
    const liquid={H:engine.propsSI("H","P",p,"Q",0,"Water"),
      U:engine.propsSI("U","P",p,"Q",0,"Water"),
      S:engine.propsSI("S","P",p,"Q",0,"Water"),
      v:1/engine.propsSI("D","P",p,"Q",0,"Water")};
    const vapor={H:engine.propsSI("H","P",p,"Q",1,"Water"),
      U:engine.propsSI("U","P",p,"Q",1,"Water"),
      S:engine.propsSI("S","P",p,"Q",1,"Water"),
      v:1/engine.propsSI("D","P",p,"Q",1,"Water")};
    const mix={
      H:engine.propsSI("H","P",p,"Q",x,"Water"),
      U:engine.propsSI("U","P",p,"Q",x,"Water"),
      S:engine.propsSI("S","P",p,"Q",x,"Water"),
      v:1/engine.propsSI("D","P",p,"Q",x,"Water")
    };
    for(const key of ["H","U","S","v"]){
      closeEnough(mix[key],liquid[key]+x*(vapor[key]-liquid[key]),
        Math.max(0.001,Math.abs(mix[key])*1e-6),`quality mixture ${key} at ${p} Pa`);
    }
    closeEnough(mix.H,mix.U+p*mix.v,0.5,`h=u+p*v at ${p} Pa`);
    console.log(`  Wet steam p=${p/1e5} bar, x=0.35: h/u/s/v mixtures and h=u+pv OK`);
  }

  // A physically valid process must not silently change enthalpy during
  // textbook throttling, even when display inputs and outputs use kJ/kg.
  for(const fluid of ["Water","Ammonia","R134a"]){
    const start={fluid,input1:"T",value1:150,input2:"P",value2:10};
    if(fluid==="R134a")start.value1=80;
    const state=computeState(engine,start);
    const recovered=computeState(engine,{
      fluid,input1:"P",value1:5,input2:"H",value2:state.values.H
    });
    closeEnough(recovered.valuesSI.H,state.valuesSI.H,0.5,fluid+" textbook throttling Δh");
    assert.ok(Number.isFinite(recovered.valuesSI.T),
      fluid+" P-h inverse did not provide a valid final temperature");
    console.log(`  ${fluid.padEnd(10)} throttling P-h consistency OK`);
  }

  console.log(`Independent IF97: ${count} published numeric comparisons across ${IAPWS_IF97_INDEPENDENT_CASES.length} (T,P) states + ${IAPWS_IF97_SATURATION_CASES.length} saturation points. Maximum state-property relative deviation: ${(largest*100).toFixed(3)}%.`);

  console.log("\nCoolProp numerical and diagram reference verification passed.");
} finally {
  rmSync(scratch,{recursive:true,force:true});
}
