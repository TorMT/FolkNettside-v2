import test from "node:test";
import assert from "node:assert/strict";
import {courseTableConfig,courseTableDefaultRows,courseCalibrationSummary,
  tableReferenceProfile,DEFAULT_FLUIDS} from "../src/tools/coolprop-core.js";
import {coolPropToolHTML} from "../src/tools/coolprop-tool.js";

test("all ten fluid choices expose at least one table with correct fluid name",()=>{
  for(const fluid of DEFAULT_FLUIDS){
    const config=courseTableConfig(fluid);
    assert.ok(config?.tables?.length,fluid);
    for(const table of config.tables){
      const rows=courseTableDefaultRows(fluid,table.id);
      assert.ok(rows.length>0,fluid+"/"+table.id);
      assert.ok(["sat-T","sat-P","native-tp","ideal-gas","superheated","compressed"].includes(table.mode));
    }
    const html=coolPropToolHTML({fluid,tab:"reference"});
    assert.match(html,/id="cp-reference-audit"/);
    assert.match(html,/id="cp-reference-table"/);
    for(const table of config.tables)assert.ok(html.includes(table.id),fluid+"/"+table.id);
  }
});
test("a fluid switch changes table IDs and headings, never leaves Air A-22 selected",()=>{
  const ammonia=coolPropToolHTML({fluid:"Ammonia",tab:"reference",reference:{tableId:"A-22"}});
  assert.match(ammonia,/A-13/);
  assert.doesNotMatch(ammonia,/value="A-22"/);
  const nitrogen=coolPropToolHTML({fluid:"Nitrogen",tab:"reference"});
  assert.match(nitrogen,/Native-TP/);
  assert.doesNotMatch(nitrogen,/value="A-22"/);
});
test("native reference is clearly distinguished from anchored textbook comparison",()=>{
  const engine={propsSI:(key,p1,v1,p2,v2,fluid)=>(
    key==="H"?1000+v1:key==="U"?900+v1:key==="S"?5+v1:1
  )};
  const water=courseCalibrationSummary(engine,"Water");
  assert.equal(water.status,"native-only");
  assert.match(water.note,/No independently sourced/);
  const r134a=courseCalibrationSummary(engine,"R134a");
  assert.equal(r134a.status,"native-only");
  const air=courseCalibrationSummary(engine,"Air");
  assert.equal(air.rows.length,4);
  assert.ok(air.rows.some(row=>row.status==="REVIEW"));
  assert.equal(tableReferenceProfile("Ammonia").fluid,"Ammonia");
});
