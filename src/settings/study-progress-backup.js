/** Portable, local-only study progress backup. No accounts, fetch or cloud writes. */
const FORMAT="folk-v2-study-progress";
const PREFIXES=["folk-v2-video:","folknet:quiz:"];
const MAX_RECORDS=2500;
const MAX_BYTES=2_000_000;
const MAX_VALUE_BYTES=160_000;

export const isStudyProgressKey=key=>typeof key==="string"&&key.length<1800&&
  !/[\u0000-\u001f\u007f]/.test(key)&&
  PREFIXES.some(prefix=>key.startsWith(prefix)&&key.length>prefix.length);

function checkValue(value,key){
  if(typeof value!=="string"||value.length>MAX_VALUE_BYTES)
    throw Error("Study progress record is too large or not text: "+key.slice(0,80));
  let parsed;
  try{parsed=JSON.parse(value)}
  catch{throw Error("Study progress record is not valid JSON: "+key.slice(0,80))}
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))
    throw Error("Study progress record is not an object: "+key.slice(0,80));
  // Existing quiz versions include both attempt and selected-question records.
  // Do not rewrite their schema: the viewer validates them when it reads them.
  if(key.startsWith("folk-v2-video:")&&Object.keys(parsed).length){
    if(!Number.isFinite(parsed.position)||parsed.position<0||
       !Number.isFinite(parsed.duration)||parsed.duration<0||
       typeof parsed.watched!=="boolean"||
       !Number.isFinite(parsed.updatedAt)||parsed.updatedAt<=0)
       throw Error("Invalid video progress: "+key.slice(0,80));
  }
  return parsed;
}
function checkRecords(records){
  if(!Array.isArray(records)||records.length>MAX_RECORDS)
    throw Error("Study progress backup exceeds record limit");
  const seen=new Set();
  let size=0;
  const checked=[];
  for(const item of records){
    const key=item?.key,value=item?.value;
    if(!isStudyProgressKey(key)||seen.has(key))
      throw Error("Unknown or repeated study progress key");
    seen.add(key);
    const parsed=checkValue(value,key);
    size+=key.length+value.length;
    if(size>MAX_BYTES)throw Error("Study progress backup exceeds size limit");
    checked.push({key,value,parsed});
  }
  return checked;
}

export function createStudyProgressBackup(storage=globalThis.localStorage,{now=new Date()}={}){
  const entries=[];
  for(let i=0;i<storage.length;i++){
    const key=storage.key(i);
    if(!isStudyProgressKey(key))continue;
    const value=storage.getItem(key);
    if(value!==null)entries.push({key,value});
  }
  entries.sort((a,b)=>a.key.localeCompare(b.key));
  checkRecords(entries);
  return {format:FORMAT,schemaVersion:1,exportedAt:now.toISOString(),records:entries};
}

const timestamp=parsed=>Number.isFinite(parsed?.updatedAt)&&parsed.updatedAt>0
  ?parsed.updatedAt:null;

/** Validate the complete input before writing; existing undated records win
 * over imported undated records. Import does not clear any progress. */
export function importStudyProgressBackup(backup,storage=globalThis.localStorage){
  if(!backup||backup.format!==FORMAT||backup.schemaVersion!==1||
      typeof backup.exportedAt!=="string"||
      !Number.isFinite(Date.parse(backup.exportedAt)))
    throw Error("Unsupported study progress backup");
  const records=checkRecords(backup.records);
  const changes=[];
  let skipped=0,unchanged=0;
  for(const {key,value,parsed} of records){
    const old=storage.getItem(key);
    if(old===value){unchanged++;continue}
    if(old!==null){
      // Never clobber a malformed local copy: it may be the only surviving
      // record. The user can export that original before troubleshooting.
      let previous;
      try{previous=checkValue(old,key)}
      catch{skipped++;continue}
      const incomingTime=timestamp(parsed),oldTime=timestamp(previous);
      if(incomingTime===null||oldTime===null||incomingTime<=oldTime){
        skipped++;continue;
      }
    }
    changes.push({key,value,old});
  }
  const written=[];
  try{
    for(const change of changes){
      // Avoid overwriting data modified in another tab since preflight.
      if(storage.getItem(change.key)!==change.old)
        throw Error("Study progress changed during import. Retry with the current data.");
      storage.setItem(change.key,change.value);
      written.push(change);
    }
  }catch(error){
    // Best-effort rollback; do not overwrite a concurrent newer value.
    for(const {key,value,old} of written.reverse()){
      try{
        if(storage.getItem(key)===value){
          if(old===null)storage.removeItem(key);
          else storage.setItem(key,old);
        }
      }catch{}
    }
    throw Error("Study progress import failed: "+String(error?.message||error));
  }
  return {imported:changes.length,skipped,unchanged};
}
