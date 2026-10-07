import test from "node:test";
import assert from "node:assert/strict";
import {gzCurveCSV,hydrostaticRowsCSV} from "../src/hydro/export.js";

test("hydrostatic CSV uses stable engineering columns and finite numbers",()=>{
  const csv=hydrostaticRowsCSV([{
    draft:1.2,displacementTonnes:123.45,waterplaneArea:40,lcb:2,tcb:0,kb:.6,lcf:2.1,tcf:0,
    tonnesPerCm:.41,bmTransverse:1.1,bmLongitudinal:8,kmTransverse:1.7,kmLongitudinal:8.6,
    gmTransverse:.7,gmLongitudinal:7.6
  }]);
  assert.match(csv,/draft_m,displacement_t,waterplane_area_m2/);
  assert.match(csv,/1.2,123.45,40,2,0,0.6/);
  assert.ok(csv.endsWith("\n"));
});

test("GZ CSV exports heel, waterline, arm and righting moment",()=>{
  const csv=gzCurveCSV([{heelDeg:10,waterline:1.04,gz:.22,rightingMoment:123456,displacementMass:40000}]);
  assert.equal(csv.split("\n")[0],"heel_deg,draft_m,gz_m,righting_moment_Nm,displacement_mass_kg");
  assert.match(csv,/10,1.04,0.22,123456,40000/);
});
