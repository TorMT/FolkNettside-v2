/** Local-only Drive destination; folder IDs are not secret but account-scoped. */
import {validMedisinDriveFolder} from "./medisin-encrypted-drive.js?v=173c85abf1c25435b1726bca261b48e2887a0d8b";
const prefix="folk-medisin-v2:drive-folder:";
export function medisinDriveFolder(sub,storage=globalThis.localStorage){
  if(typeof sub!=="string"||!sub.trim())return null;
  try{return validMedisinDriveFolder(storage?.getItem(prefix+sub))}catch{return null}
}
export function setMedisinDriveFolder(sub,folder,storage=globalThis.localStorage){
  if(typeof sub!=="string"||!sub.trim())throw new Error("Logg inn med Google før du velger mappe");
  const id=validMedisinDriveFolder(folder);
  try{
    if(id)storage?.setItem(prefix+sub,id);
    else storage?.removeItem(prefix+sub);
  }catch{throw new Error("Kunne ikke lagre valg av Google Drive-mappe på denne enheten");}
  return id;
}
