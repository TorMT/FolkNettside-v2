// Private, explicit Google Drive backups for the native MedisinTimer migration.
// The legacy cross-origin iframe is deliberately NOT read or modified here.
import {getGoogleAccessToken,getGoogleSessionSnapshot} from "./google-session.js?v=1c0dceae9bc922bebf73eab9f6487dd3ab3fe668";
const FILE="folk-medisin-v2.json";
const API="https://www.googleapis.com/drive/v3/files";
const UPLOAD="https://www.googleapis.com/upload/drive/v3/files";
export function validateMedisinBackup(value){
  if(!value||typeof value!=="object"||Array.isArray(value)||value.schema!==1||!Array.isArray(value.entries))
    throw new Error("Unsupported MedisinTimer backup schema");
  if(value.entries.length>10000||JSON.stringify(value).length>2_000_000)throw new Error("Backup too large");
  const ids=new Set();
  for(const entry of value.entries){
    if(!entry||typeof entry!=="object"||!String(entry.id||"").trim()||
       ids.has(entry.id)||!Number.isFinite(Date.parse(entry.updatedAt))||
       !Number.isFinite(Number(entry.durationSeconds))||Number(entry.durationSeconds)<0)
      throw new Error("Invalid timer entry or duplicate ID");
    ids.add(entry.id);
    if(entry.type==="timer"){
      if(typeof entry.name!=="string"||!entry.name.trim()||entry.name.length>160||
        !(Number(entry.durationSeconds)>0)||!Number.isFinite(Number(entry.halfLifeSeconds))||
        Number(entry.halfLifeSeconds)<0||!(Number(entry.amount)>0)||
        !["mg","mcg","g","IU","enheter"].includes(entry.unit))
        throw new Error("Invalid timer fields");
    }else if(entry.type==="dose"){
      if(!String(entry.timerId||"").trim()||!Number.isFinite(Date.parse(entry.takenAt))||
        !(Number(entry.amount)>0)||!["mg","mcg","g","IU","enheter"].includes(entry.unit))
        throw new Error("Invalid dose fields");
    }
  }
  return value;
}
export function newMedisinBackup(entries=[]){
  return validateMedisinBackup({schema:1,updatedAt:new Date().toISOString(),entries});
}
export function mergeMedisinBackups(local,remote){
  validateMedisinBackup(local);validateMedisinBackup(remote);
  const merged=new Map();
  for(const entry of [...remote.entries,...local.entries]){
    const previous=merged.get(entry.id);
    const delta=previous?Date.parse(entry.updatedAt)-Date.parse(previous.updatedAt):1;
    if(!previous||delta>0||delta===0&&(
      (Boolean(entry.deleted)&&!Boolean(previous.deleted))||
      (Boolean(entry.deleted)===Boolean(previous.deleted)&&JSON.stringify(entry)>JSON.stringify(previous))
    ))merged.set(entry.id,entry);
  }
  return newMedisinBackup([...merged.values()].sort((a,b)=>a.id.localeCompare(b.id)));
}
async function driveRequest(url,options={}){
  if(getGoogleSessionSnapshot().status!=="signed-in")throw new Error("Sign in from Account & connections first");
  const token=await getGoogleAccessToken({interactive:false});
  const headers=new Headers(options.headers||{});
  headers.set("Authorization",`Bearer ${token}`);
  const result=await fetch(url,{...options,headers,cache:"no-store"});
  if(!result.ok)throw new Error(`Google Drive HTTP ${result.status}`);
  return result;
}
export async function findMedisinDriveBackup(){
  const q=encodeURIComponent(`name = '${FILE}' and mimeType = 'application/json' and trashed = false`);
  const response=await driveRequest(`${API}?spaces=drive&fields=nextPageToken,files(id,name,modifiedTime)&pageSize=100&q=${q}`);
  const files=(await response.json()).files||[];
  // Multiple matching files are ambiguous. Never overwrite an arbitrary one.
  if(files.length>1)throw new Error("Multiple MedisinTimer backups found; resolve duplicates before saving");
  return files[0]||null;
}
export async function readMedisinDriveBackup(){
  const file=await findMedisinDriveBackup();
  if(!file)return null;
  const response=await driveRequest(`${API}/${encodeURIComponent(file.id)}?alt=media`);
  return {file,backup:validateMedisinBackup(await response.json())};
}
export async function writeMedisinDriveBackup(backup,{allowReplace=false}={}){
  validateMedisinBackup(backup);
  const existing=await findMedisinDriveBackup();
  if(existing&&!allowReplace)throw new Error("Cloud backup exists: read and merge before replacing");
  if(existing){
    // User action must explicitly confirm replacement after reviewing the remote contents.
    const response=await driveRequest(`${UPLOAD}/${encodeURIComponent(existing.id)}?uploadType=media`,{
      method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(backup)
    });
    return response.json();
  }
  const boundary="folkMedisinBoundary";
  const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name:FILE,mimeType:"application/json",description:"Folk MedisinTimer private backup"})}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(backup)}\r\n--${boundary}--`;
  const response=await driveRequest(`${UPLOAD}?uploadType=multipart&fields=id,name,modifiedTime`,{
    method:"POST",headers:{"Content-Type":`multipart/related; boundary=${boundary}`},body
  });
  return response.json();
}
