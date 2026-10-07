import test from "node:test";
import assert from "node:assert/strict";
import {analysisCapability,capabilityLabel,modelCapabilitySummary} from "../src/engineering/capabilities.js";

test("analysis capabilities are opt-in except model viewing",()=>{
  assert.equal(analysisCapability({},"model").enabled,true);
  const hydro=analysisCapability({},"hydro");
  assert.equal(hydro.enabled,false);
  assert.equal(hydro.status,"not declared");
  assert.match(hydro.reason,/does not declare/i);
});

test("capability contract supports explicit ready and blocked states",()=>{
  const config={analysisCapabilities:{
    hydro:{enabled:true,status:"validated",reason:"watertight"},
    resistance:{enabled:false,status:"not configured",reason:"missing wetted surface",requirements:["surface","draft"]}
  }};
  const hydro=analysisCapability(config,"hydro");
  assert.equal(hydro.enabled,true);
  assert.equal(capabilityLabel(hydro),"Validated");

  const resistance=analysisCapability(config,"resistance");
  assert.equal(resistance.enabled,false);
  assert.equal(capabilityLabel(resistance),"Blocked · Not Configured");
  assert.deepEqual(resistance.requirements,["surface","draft"]);
});

test("capability summary covers all Engineering modes",()=>{
  const summary=modelCapabilitySummary({analysisCapabilities:{model:"ready"}});
  assert.deepEqual(Object.keys(summary),["model","hydro","structure","resistance","propulsion"]);
  assert.equal(summary.model.enabled,true);
  assert.equal(summary.structure.enabled,false);
});
