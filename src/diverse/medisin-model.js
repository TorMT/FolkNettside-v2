import {mergeMedisinBackups,newMedisinBackup,validateMedisinBackup} from "../platform/medisin-drive.js?v=d87ab3a7143f047a2d9885ac4c244af2dfe37378";

export const MEDISIN_LOCAL_PREFIX="folk-medisin-v2:";
export const MEDISIN_GUEST_KEY=MEDISIN_LOCAL_PREFIX+"guest";
const DAY=86400;
export function medisinStorageKey(profileSub){
  return MEDISIN_LOCAL_PREFIX+(profileSub?"google:"+profileSub:"guest");
}
export function medisinTimers(backup){
  validateMedisinBackup(backup);
  return backup.entries.filter(e=>e.type==="timer"&&!e.deleted).sort((a,b)=>a.name.localeCompare(b.name,"no"));
}
export function medisinDoses(backup,timerId){
  validateMedisinBackup(backup);
  return backup.entries.filter(e=>e.type==="dose"&&e.timerId===timerId&&!e.deleted)
    .sort((a,b)=>Date.parse(b.takenAt)-Date.parse(a.takenAt));
}
export function medisinRemainingLevel(backup,timerId,at=Date.now()){
  const timer=medisinTimers(backup).find(t=>t.id===timerId);
  const halfLife=Number(timer?.halfLifeSeconds);
  if(!timer||!Number.isFinite(halfLife)||halfLife<=0)return null;
  return medisinDoses(backup,timerId).reduce((total,dose)=>{
    const elapsed=(at-Date.parse(dose.takenAt))/1000;
    if(!Number.isFinite(elapsed)||elapsed<0)return total;
    return total+Number(dose.amount||0)*Math.pow(2,-elapsed/halfLife);
  },0);
}
export function medisinNextAt(backup,timerId){
  const timer=medisinTimers(backup).find(t=>t.id===timerId);
  const last=medisinDoses(backup,timerId)[0];
  if(!last||!timer||!(timer.durationSeconds>0))return null;
  return Date.parse(last.takenAt)+timer.durationSeconds*1000;
}
export function medisinChart(backup,timerId,now=Date.now(),samples=49){
  const timer=medisinTimers(backup).find(t=>t.id===timerId);
  const last=medisinDoses(backup,timerId).at(-1);
  if(!timer||!(timer.halfLifeSeconds>0))return [];
  const start=last?Math.min(Date.parse(last.takenAt),now):now;
  const end=now+Math.min(Math.max(timer.halfLifeSeconds*2000,DAY*1000),30*DAY*1000);
  return Array.from({length:samples},(_,i)=>{
    const t=start+(end-start)*i/(samples-1);
    return {time:t,level:medisinRemainingLevel(backup,timerId,t)};
  });
}
export function medisinApply(backup,record){
  validateMedisinBackup(backup);
  if(!record||!String(record.id||"").trim())throw new Error("Missing record ID");
  const updatedAt=record.updatedAt||new Date().toISOString();
  const validated={...record,updatedAt};
  return mergeMedisinBackups(backup,newMedisinBackup([validated]));
}
export function medisinCreateTimer({id,name,intervalHours,halfLifeHours,amount,unit,at=new Date().toISOString()}){
  const durationSeconds=Number(intervalHours)*3600;
  const halfLifeSeconds=Number(halfLifeHours)*3600;
  const strength=Number(amount);
  if(!id||!String(name||"").trim()||String(name).length>160)throw new Error("Skriv inn et navn (maks 160 tegn).");
  if(!Number.isFinite(durationSeconds)||durationSeconds<=0||durationSeconds>365*DAY)throw new Error("Ugyldig intervall.");
  if(!Number.isFinite(halfLifeSeconds)||halfLifeSeconds<0||halfLifeSeconds>365*DAY)throw new Error("Ugyldig halveringstid.");
  if(!Number.isFinite(strength)||strength<=0||strength>1e12)throw new Error("Ugyldig mengde.");
  if(!["mg","mcg","g","IU","enheter"].includes(unit))throw new Error("Ugyldig enhet.");
  return {id,type:"timer",name:String(name).trim(),durationSeconds,halfLifeSeconds,
    amount:strength,unit,createdAt:at,updatedAt:at};
}
export function medisinCreateDose(timer,{id,takenAt=new Date().toISOString()}){
  if(!timer||timer.type!=="timer"||!id||!Number.isFinite(Date.parse(takenAt)))throw new Error("Ugyldig dose.");
  return {id,type:"dose",timerId:timer.id,takenAt,amount:timer.amount,unit:timer.unit,
    durationSeconds:0,updatedAt:new Date().toISOString()};
}
export function medisinDelete(backup,id,at=new Date().toISOString()){
  const existing=backup.entries.find(item=>item.id===id);
  if(!existing)return backup;
  return medisinApply(backup,{...existing,deleted:true,updatedAt:at});
}
