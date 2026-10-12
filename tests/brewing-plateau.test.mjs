import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const code=readFileSync(new URL("../src/diverse/brewing/legacy/hydrometer-intelligence.js",import.meta.url),"utf8");
const context={window:{},Intl,Date,Math,Number};
vm.runInNewContext(code,context,{filename:"hydrometer-intelligence.js"});
const engine=context.window.HydrometerIntelligence;
const style={name:"Cream ale",fgRange:[1.006,1.012],typicalDays:[4,8]};
const when=(hours)=>new Date(Date.UTC(2026,9,1,12,0,0)+hours*3600000).toISOString();
const series=(values,step=12)=>values.map((gravity,i)=>({createdOn:when(i*step),gravity,temperature:20}));
const forecast=(rows,target=style)=>engine.buildForecast({rows,styleMatch:target});

test("48+ hour plateau near a known FG reports measured stability, not new completion ETA",()=>{
 const rows=series([1.0114,1.0111,1.0112,1.011,1.011,1.0109,1.0111],12);
 const result=engine.assessFermentationPlateau(rows,style);
 assert.equal(result.status,"stable-near-target");
 assert.ok(result.spanHours>=48);
 assert.match(forecast(rows),/hovedgjæringen kan være ferdig/);
 assert.doesNotMatch(forecast(rows),/døgn til|timer med estimert/i);
 assert.match(forecast(rows),/ny, uavhengig SG-måling/);
});

test("flat gravity above expected FG warns stall, never labels it complete",()=>{
 const rows=series([1.0273,1.0271,1.027,1.0271,1.027,1.027],12);
 assert.equal(engine.assessFermentationPlateau(rows,style).status,"stalled-above-target");
 const text=forecast(rows);
 assert.match(text,/stoppet eller treg gjæring/);
 assert.match(text,/ikke ferdig gjæring/);
 assert.doesNotMatch(text,/døgn til/);
});

test("flat gravity with no trustworthy FG cannot guess fermentation completion",()=>{
 const rows=series([1.020,1.0198,1.0201,1.0199,1.020],12);
 assert.equal(engine.assessFermentationPlateau(rows,null).status,"stable-unknown-target");
 assert.match(forecast(rows,null),/kan ikke avgjøre/);
});

test("active gravity descent is not mistaken for completion",()=>{
 const rows=series([1.050,1.046,1.043,1.039,1.036,1.032,1.029],12);
 assert.equal(engine.assessFermentationPlateau(rows,style).status,"active-or-variable");
 assert.doesNotMatch(forecast(rows),/Ingen ny sluttdato/);
});

test("short, duplicate or noisy readings never produce a false plateau",()=>{
 const tooShort=series([1.012,1.011,1.011,1.011],4);
 assert.equal(engine.assessFermentationPlateau(tooShort,style).status,"insufficient");
 const dups=series([1.012,1.011,1.011,1.011],0);
 assert.equal(engine.assessFermentationPlateau(dups,style).status,"insufficient");
 const noisy=series([1.010,1.014,1.009,1.015,1.010],12);
 assert.equal(engine.assessFermentationPlateau(noisy,style).status,"active-or-variable");
});

test("support SG sensor values in 1000 scale and retain actual last observation date",()=>{
 const rows=series([1010.5,1010.3,1010.4,1010.4,1010.3],12);
 const result=engine.assessFermentationPlateau(rows,style);
 assert.equal(result.status,"stable-near-target");
 assert.equal(result.observedAt,when(48));
 assert.match(forecast(rows),/Siste tilgjengelige måleserie/);
});
