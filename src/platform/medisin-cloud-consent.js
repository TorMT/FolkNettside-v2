/**
 * Consent for sensitive MedisinTimer JSON backups is separate from Google login.
 * Until E2E encryption is implemented, never upload health data just because
 * an account is connected. Opt-in is local and scoped per verified Google sub.
 */
const PREFIX="folk-medisin-v2:plaintext-drive-optin:";
const ACCEPTED="explicit-plaintext-v1";
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
