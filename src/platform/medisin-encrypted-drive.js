/**
 * Encrypted MedisinTimer Drive adapter.
 * Drive sees only opaque ciphertext; does not read/replace legacy plaintext
 * folk-medisin-v2.json. Scoped to a deterministic account vault name.
 */
import {getGoogleAccessToken,getGoogleSessionSnapshot} from "./google-session.js?v=0f844debfa3e429b17d85efc8470bb32b5a6e51c";
import {validateMedisinBackup} from "./medisin-drive.js?v=0f844debfa3e429b17d85efc8470bb32b5a6e51c";
import {encryptMedisinVault,decryptMedisinVault,medisinVaultFileName} from "./medisin-vault.js?v=0f844debfa3e429b17d85efc8470bb32b5a6e51c";

const API="https://www.googleapis.com/drive/v3/files";
const UPLOAD="https://www.googleapis.com/upload/drive/v3/files";
const acceptFolder=value=>{
  if(value===null||value===undefined||value==="")return null;
  if(typeof value!=="string"||! /^[A-Za-z0-9_-]{10,200}$/.test(value))
    throw new Error("Ugyldig Google Drive-mappe-ID. Kopier ID-en fra mappelenken.");
  return value;
};
export function validMedisinDriveFolder(folderId){return acceptFolder(folderId)}
const ensureProfile=sub=>{
  const profile=getGoogleSessionSnapshot();
  if(profile.status!=="signed-in"||profile.profile?.sub!==sub)
    throw new Error("Google-kontoen ble endret eller er logget ut. Ingen data ble lastet opp.");
};
async function request(sub,url,options={}){
  ensureProfile(sub);
  const token=await getGoogleAccessToken({interactive:false});
  ensureProfile(sub);
  const headers=new Headers(options.headers||{});
  headers.set("Authorization","Bearer "+token);
  const response=await fetch(url,{...options,headers,cache:"no-store"});
  if(!response.ok)throw new Error("Google Drive svarte HTTP "+response.status);
  ensureProfile(sub);
  return response;
}
export async function findEncryptedMedisinDriveBackup(sub,{folderId=null}={}){
  const name=await medisinVaultFileName(sub);
  const folder=acceptFolder(folderId);
  const quote=value=>value.replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  const q="name = '"+quote(name)+"' and trashed = false and "+
    (folder?"'"+quote(folder)+"' in parents":"'root' in parents");
  const params=new URLSearchParams({q,spaces:"drive",
    fields:"nextPageToken,files(id,name,mimeType,parents,modifiedTime)",
    pageSize:"100",supportsAllDrives:"true",includeItemsFromAllDrives:"true"});
  const response=await request(sub,API+"?"+params.toString());
  const json=await response.json();
  if(json.nextPageToken)throw new Error("Too many Drive matches: cannot select a safe backup");
  const files=Array.isArray(json.files)?json.files:[];
  if(files.length>1)throw new Error("Multiple encrypted backups found. Resolve duplicate files before synchronization.");
  return files[0]||null;
}
export async function readEncryptedMedisinDriveBackup(sub,passphrase,{folderId=null}={}){
  const file=await findEncryptedMedisinDriveBackup(sub,{folderId});
  if(!file)return null;
  const response=await request(sub,API+"/"+encodeURIComponent(file.id)+"?alt=media&supportsAllDrives=true");
  const text=await response.text();
  if(text.length>4_000_000)throw new Error("Encrypted vault is too large");
  const envelope=JSON.parse(text);
  const backup=validateMedisinBackup(await decryptMedisinVault(envelope,passphrase));
  return {file,backup};
}
export async function writeEncryptedMedisinDriveBackup(sub,passphrase,backup,{folderId=null,allowReplace=false}={}){
  validateMedisinBackup(backup);
  const folder=acceptFolder(folderId);
  const existing=await findEncryptedMedisinDriveBackup(sub,{folderId:folder});
  if(existing&&!allowReplace)throw new Error("Encrypted backup already exists; read/merge before replacing");
  // The user-supplied key is only ever used by crypto.subtle, never sent to Drive.
  const envelope=await encryptMedisinVault(backup,passphrase);
  const serialized=JSON.stringify(envelope);
  ensureProfile(sub);
  if(existing){
    const response=await request(sub,UPLOAD+"/"+encodeURIComponent(existing.id)+
      "?uploadType=media&supportsAllDrives=true&fields=id,name,modifiedTime",{
        method:"PATCH",headers:{"Content-Type":"application/json"},body:serialized});
    return response.json();
  }
  const name=await medisinVaultFileName(sub);
  const metadata={name,mimeType:"application/json",
    description:"End-to-end encrypted Folk MedisinTimer vault; recovery passphrase is not stored."};
  if(folder)metadata.parents=[folder];
  const boundary="folkMedisinEncrypted"+crypto.randomUUID().replaceAll("-","");
  const body="--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+
    JSON.stringify(metadata)+"\r\n--"+boundary+
    "\r\nContent-Type: application/json\r\n\r\n"+serialized+
    "\r\n--"+boundary+"--";
  const response=await request(sub,UPLOAD+
    "?uploadType=multipart&supportsAllDrives=true&fields=id,name,modifiedTime",{
      method:"POST",headers:{"Content-Type":"multipart/related; boundary="+boundary},body});
  return response.json();
}
