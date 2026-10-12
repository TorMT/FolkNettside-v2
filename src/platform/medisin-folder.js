/** Local-only Drive destination; folder IDs are not secret but account-scoped. */
import {validMedisinDriveFolder} from "./medisin-encrypted-drive.js?v=1fc73ec8f1ab395a398b566fd8d523b50485fb25";
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
