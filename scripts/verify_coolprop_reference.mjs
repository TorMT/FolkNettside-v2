import assert from "node:assert/strict";
import {copyFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

import {
  TABLE_REFERENCE_PROFILES,
  applyBookBasis,
  phaseDescription,
  removeBookBasis,
  verifyTableReference
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
    assert.ok(Math.abs(row.errors.H)<=2000,`Air A-22 H mismatch at ${row.T} K: ${row.errors.H} J/kg`);
    assert.ok(Math.abs(row.errors.U)<=2000,`Air A-22 U mismatch at ${row.T} K: ${row.errors.U} J/kg`);
    assert.ok(Math.abs(row.errors.S)<=10,`Air A-22 S mismatch at ${row.T} K: ${row.errors.S} J/(kg K)`);
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
  console.log("\nCoolProp numerical reference verification passed.");
} finally {
  rmSync(scratch,{recursive:true,force:true});
}
