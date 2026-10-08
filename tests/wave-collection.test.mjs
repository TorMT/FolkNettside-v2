import test from "node:test";
import assert from "node:assert/strict";
import {makeWaveRecord,sampleWaveRecord,importWaveCSV,appendWaveRecord,
 readWaveCollection,writeWaveCollection,MAX_WAVE_CASES} from "../src/model/wave-collection.js";
import {normaliseWaveCase} from "../src/model/wave-core.js";

test("synthetic wave samples have explicit provenance and numeric probe history",()=>{
 const wave=normaliseWaveCase({heightM:1.6,periodS:4.5,headingDeg:30});
 const item=sampleWaveRecord(wave,{name:"Beam sea",x:2,y:-1});
 assert.equal(item.source,"synthetic");
 assert.equal(item.theory.includes("illustrative"),true);
 assert.equal(item.wave.heightM,1.6);
 assert.equal(item.probe.x,2);
 assert.ok(item.points.length>=60);
});
test("imported CSV stays imported through local collection serialization and never becomes a wave model",()=>{
 const record=importWaveCSV("time_s,eta_m\n0,0.2\n1,-0.1\n2,0.3\n",{filename:"probe.csv"});
 assert.equal(record.source,"imported");
 assert.equal(record.wave,null);
 const memory=new Map(),storage={getItem:key=>memory.get(key)||null,setItem:(key,val)=>memory.set(key,val)};
 writeWaveCollection([record,sampleWaveRecord({heightM:1,periodS:6})],storage);
 const restored=readWaveCollection(storage);
 assert.equal(restored.length,2);
 assert.equal(restored[0].source,"imported");
 assert.equal(restored[0].wave,null);
 assert.equal(restored[0].points[1].elevationM,-.1);
 assert.equal(restored[1].source,"synthetic");
 assert.equal(restored[1].wave.waterDepthM,null);
});
test("wave library bounds and invalid source labels are enforced",()=>{
 const seed=sampleWaveRecord({heightM:1,periodS:4});
 const many=Array.from({length:MAX_WAVE_CASES+8},(_,i)=>({...seed,id:"case-"+i}));
 const records=many.reduce((current,item)=>appendWaveRecord(current,item),[]);
 assert.equal(records.length,MAX_WAVE_CASES);
 assert.equal(records[0].id,"case-8");
 assert.throws(()=>makeWaveRecord({source:"imported",wave:{heightM:1,periodS:5},
   points:[{timeS:0,elevationM:0}]}),/cannot be marked/);
});
