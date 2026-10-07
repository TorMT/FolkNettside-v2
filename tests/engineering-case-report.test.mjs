import test from "node:test";
import assert from "node:assert/strict";
import {engineeringCaseFilename,engineeringCaseReport} from "../src/engineering/case-report.js";

test("Engineering case report preserves provenance without raw geometry",()=>{
  const report=engineeringCaseReport({
    modelConfig:{id:"fixture",name:"Fixture"},
    modelDocument:{
      name:"Loaded fixture",format:"3MF",unit:"meter",
      source:{format:"3MF",archiveEntry:"model.3mf"}
    },
    mode:"Hydro",
    capability:{enabled:true,status:"fixture",reason:"analytic",requirements:[]},
    method:{name:"clipped-triangle hydrostatics",scope:"constant density"},
    inputs:{draft:1.2,density:1025},
    results:{
      volume:36,
      centerOfBuoyancy:[0,0,.6],
      geometry:{positions:[1,2,3]},
      typed:new Float64Array([1,2])
    },
    assumptions:["rigid hull"],
    warnings:["fixture only"],
    createdAt:"2026-10-07T10:00:00.000Z"
  });
  assert.equal(report.schema,"folknet.engineering-case");
  assert.equal(report.model.id,"fixture");
  assert.equal(report.analysis.results.volume,36);
  assert.equal(report.analysis.results.geometry,undefined);
  assert.deepEqual(report.analysis.results.typed,[1,2]);
  assert.deepEqual(report.analysis.assumptions,["rigid hull"]);
  assert.equal(report.createdAt,"2026-10-07T10:00:00.000Z");
});

test("Engineering case filename is stable and readable",()=>{
  const report={model:{name:"R/V GUNNERUS · Open Data"},analysis:{mode:"Resistance"}};
  assert.equal(engineeringCaseFilename(report),"r-v-gunnerus-open-data-resistance-case.json");
});
