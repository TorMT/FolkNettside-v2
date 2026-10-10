/** Private per-account dive log, independent of public GeoJSON map source. */
export function validateDiveEntry(value){
 if(!value||typeof value!=="object"||Array.isArray(value)||typeof value.id!=="string"||
   !value.id.trim()||value.id.length>120||!Number.isFinite(Date.parse(value.updatedAt))||
   typeof value.deleted!=="boolean")throw Error("Invalid dive log entry");
 if(value.deleted){
   if(Object.keys(value).some(key=>!["id","updatedAt","deleted"].includes(key)))
     throw Error("Deleted dive log entries cannot keep personal details");
   return value;
 }
 if(typeof value.siteName!=="string"||!value.siteName.trim()||value.siteName.length>160||
   typeof value.siteId!=="string"||value.siteId.length>120||
   !Number.isFinite(Date.parse(value.divedAt))||
   !Number.isFinite(value.maxDepthM)||value.maxDepthM<0||value.maxDepthM>500||
   !Number.isFinite(value.durationMinutes)||value.durationMinutes<=0||value.durationMinutes>1440||
   typeof value.notes!=="string"||value.notes.length>2000)
   throw Error("Invalid dive fields");
 return value;
}
export function validateDiveLog(value){
 if(!value||value.schemaVersion!==1||!Array.isArray(value.entries)||value.entries.length>5000)
   throw Error("Unsupported dive log backup");
 const ids=new Set();
 for(const row of value.entries){
   validateDiveEntry(row);
   if(ids.has(row.id))throw Error("Duplicate dive log entry ID");
   ids.add(row.id);
 }
 if(JSON.stringify(value).length>1_900_000)throw Error("Dive log backup exceeds size limit");
 return value;
}
export function newDiveLog(entries=[]){return validateDiveLog({schemaVersion:1,entries})}
export function createDiveEntry(value,{id=crypto.randomUUID(),at=new Date().toISOString()}={}){
 const when=new Date(value.divedAt);
 if(!Number.isFinite(when.getTime()))throw Error("Invalid date");
 return validateDiveEntry({
   id,siteId:String(value.siteId||""),siteName:String(value.siteName||"").trim(),
   divedAt:when.toISOString(),maxDepthM:Number(value.maxDepthM),
   durationMinutes:Number(value.durationMinutes),notes:String(value.notes||""),
   updatedAt:at,deleted:false
 });
}
export function addDiveEntry(backup,value){
 validateDiveLog(backup);validateDiveEntry(value);
 if(backup.entries.some(row=>row.id===value.id))throw Error("Duplicate dive ID");
 return newDiveLog([...backup.entries,value]);
}
export function deleteDiveEntry(backup,id,at=new Date().toISOString()){
 validateDiveLog(backup);
 const current=backup.entries.find(row=>row.id===id);
 if(!current)throw Error("Unknown dive record");
 const time=Math.max(Date.parse(at),Date.parse(current.updatedAt)+1);
 return newDiveLog([...backup.entries.filter(row=>row.id!==id),
   {id,updatedAt:new Date(time).toISOString(),deleted:true}]);
}
export function mergeDiveLogs(local,remote){
 validateDiveLog(local);validateDiveLog(remote);
 const entries=new Map();
 for(const row of [...local.entries,...remote.entries]){
   const previous=entries.get(row.id);
   const cmp=previous?Date.parse(row.updatedAt)-Date.parse(previous.updatedAt):1;
   if(!previous||cmp>0||cmp===0&&(
     (row.deleted&&!previous.deleted)||
     (row.deleted===previous.deleted&&JSON.stringify(row)>JSON.stringify(previous))
   ))entries.set(row.id,row);
 }
 return newDiveLog([...entries.values()].sort((a,b)=>a.id.localeCompare(b.id)));
}
export function visibleDiveEntries(backup){
 return validateDiveLog(backup).entries.filter(row=>!row.deleted)
   .sort((a,b)=>Date.parse(b.divedAt)-Date.parse(a.divedAt)||a.id.localeCompare(b.id));
}
