// Synchronous, best-effort reconciliation for independently mounted browser
// views of the SAME MedisinTimer profile. This is NOT a cross-device or
// cross-tab atomic transaction; a true CAS/lock would require server support.
import {mergeMedisinBackups,newMedisinBackup,validateMedisinBackup} from "../platform/medisin-drive.js?v=919cdd95cbb48d558602a55fab44fb183ae39074";

export function reconcileMedisinLocalWrite(incoming,currentRaw,{previouslySeenRaw=null}={}){
  validateMedisinBackup(incoming);
  if(currentRaw===null&&previouslySeenRaw!==null){
    throw new Error("MedisinTimer-profilen ble fjernet i en annen fane. Last inn siden på nytt før lagring.");
  }
  let current;
  try{
    current=currentRaw===null?newMedisinBackup():
      validateMedisinBackup(JSON.parse(currentRaw));
  }catch{
    throw new Error("Eksisterende lokal MedisinTimer-historikk kan ikke leses. Lagring er sperret.");
  }
  // Reconcile by immutable record ID/timestamp; tombstones from a different
  // tab must remain tombstones instead of being resurrected by a stale view.
  return mergeMedisinBackups(current,incoming);
}
