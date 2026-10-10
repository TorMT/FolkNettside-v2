/**
 * Consent for encrypted MedisinTimer vault uploads is independent of Google login.
 * Legacy plaintext-sync consent keys are deliberately ignored. The passphrase
 * is required for each session, even if encrypted cloud sync was opted in.
 */
const PREFIX="folk-medisin-v2:encrypted-drive-optin:";
const ACCEPTED="explicit-encrypted-v2";
export function medisinCloudConsentKey(sub){
  if(typeof sub!=="string"||!sub.trim()||sub.length>256)return null;
  return PREFIX+sub;
}
export function medisinCloudSyncAllowed(sub,store=globalThis.localStorage){
  const key=medisinCloudConsentKey(sub);
  if(!key)return false;
  try{return store?.getItem(key)===ACCEPTED}catch{return false}
}
export function setMedisinCloudSyncAllowed(sub,allowed,store=globalThis.localStorage){
  const key=medisinCloudConsentKey(sub);
  if(!key)throw new Error("Confirmed Google account required");
  try{
    if(allowed)store?.setItem(key,ACCEPTED);
    else store?.removeItem(key);
  }catch(error){
    throw new Error("Could not save cloud-sync preference in this browser");
  }
  return medisinCloudSyncAllowed(sub,store);
}
