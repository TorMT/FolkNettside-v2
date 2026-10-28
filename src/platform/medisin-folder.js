/** Local-only Drive destination; folder IDs are not secret but account-scoped. */
import {validMedisinDriveFolder} from "./medisin-encrypted-drive.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
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
