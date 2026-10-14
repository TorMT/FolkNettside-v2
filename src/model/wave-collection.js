import {parseDelimitedText,detectCSVDelimiter} from "../viewers/csv-core.js?v=560d3200150b5bae6b37be7c40d161b2f3a0d34f";
import {normalizeWaveObservations,normaliseWaveCase,sampleWave} from "./wave-core.js?v=560d3200150b5bae6b37be7c40d161b2f3a0d34f";
const KEY="folknet-v2:wave-observations:v1";
export const MAX_WAVE_CASES=30;
export function makeWaveRecord({name="Wave case",source="synthetic",wave=null,
  points=[],probe={x:0,y:0},id=null,createdAt=new Date().toISOString()}={}){
  if(!["synthetic","imported"].includes(source))throw new Error("Invalid wave data provenance");
  if(!Array.isArray(points)||points.length>10000||!points.length)
    throw new Error("Wave record requires 1-10000 samples");
  const samples=normalizeWaveObservations([
    ["time_s","eta_m"],...points.map(p=>[p.timeS,p.elevationM])
  ]);
  const cleanWave=wave?normaliseWaveCase(wave):null;
  if(source==="imported"&&cleanWave)
    throw new Error("Imported wave samples cannot be marked as analytically generated");
  return {
    schemaVersion:1,id:id||"wave-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),
    name:String(name).trim().slice(0,120)||"Wave case",
    createdAt:String(createdAt),source,
    theory:source==="synthetic"?"linear regular wave, illustrative":"observed/imported samples; no wave dynamics inferred",
    wave:cleanWave?{
      heightM:cleanWave.heightM,periodS:cleanWave.periodS,
      headingDeg:cleanWave.headingDeg,phaseDeg:cleanWave.phaseDeg,
      waterDepthM:Number.isFinite(cleanWave.waterDepthM)?cleanWave.waterDepthM:null
    }:null,
    probe:{x:Number(probe.x)||0,y:Number(probe.y)||0},
    points:samples
  };
}
export function sampleWaveRecord(wave,options={}){
  const normalized=normaliseWaveCase(wave);
  return makeWaveRecord({
    name:options.name||"Regular wave · H "+normalized.heightM+" m / T "+normalized.periodS+" s",
    source:"synthetic",wave:normalized,
    probe:{x:options.x||0,y:options.y||0},
    points:sampleWave(normalized,{durationS:options.durationS??normalized.periodS*3,
      stepS:options.stepS??normalized.periodS/30,
      x:options.x||0,y:options.y||0})
  });
}
export function importWaveCSV(text,{filename="wave-data.csv"}={}){
  const delimiter=detectCSVDelimiter(text,filename);
  const samples=normalizeWaveObservations(parseDelimitedText(text,delimiter));
  return makeWaveRecord({source:"imported",name:filename,points:samples});
}
export function appendWaveRecord(records,item){
  const current=Array.isArray(records)?records:[];
  return [...current.filter(x=>x.id!==item.id),item].slice(-MAX_WAVE_CASES);
}
export function readWaveCollection(storage=globalThis.localStorage){
  try{
    const value=JSON.parse(storage.getItem(KEY)||"[]");
    if(!Array.isArray(value))return [];
    return value.slice(-MAX_WAVE_CASES).map(record=>makeWaveRecord({
      ...record,points:record.points,
      wave:record.wave
        ?{...record.wave,waterDepthM:record.wave.waterDepthM==null?Infinity:record.wave.waterDepthM}
        :null
    }));
  }catch{return []}
}
export function writeWaveCollection(records,storage=globalThis.localStorage){
  const items=(records||[]).slice(-MAX_WAVE_CASES);
  // Reject oversize payloads: large imported files should be downloaded, not
  // silently saturate the browser's persistent storage quota.
  const value=JSON.stringify(items);
  if(value.length>2500000)throw new Error("Wave library too large for local storage; export JSON first");
  storage.setItem(KEY,value);
  return items.length;
}


export function importWaveCollectionJSON(text){
  let parsed;
  try{parsed=JSON.parse(text)}catch{throw new Error("Invalid wave collection JSON")}
  if(parsed?.schemaVersion!==1||parsed.kind!=="wave-collection"||
     !Array.isArray(parsed.records)||parsed.records.length>MAX_WAVE_CASES)
    throw new Error("Unsupported wave collection schema or too many records");
  return parsed.records.map(record=>makeWaveRecord({
    ...record,points:record.points,
    wave:record.wave?{
      ...record.wave,waterDepthM:record.wave.waterDepthM==null?
        Infinity:record.wave.waterDepthM
    }:null
  }));
}
