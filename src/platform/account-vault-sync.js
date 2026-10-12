/**
 * Private, account-scoped V2 data vault for modules other than MedisinTimer.
 * Separate cryptographic purpose, file name and envelope for every module.
 * Authentication uses the single site Google session; no OAuth prompts here.
 * No passphrase or derived key is persisted or sent to Google Drive.
 */
import {getGoogleAccessToken,getGoogleSessionSnapshot} from "./google-session.js?v=18070131bbf485bf1f82a2087936d2bb01cc4150";

const BASE="https://www.googleapis.com/drive/v3/files";
const UPLOAD="https://www.googleapis.com/upload/drive/v3/files";
const ENCODER=new TextEncoder();
const DECODER=new TextDecoder("utf-8",{fatal:true});
const ITERATIONS=310000;
const LIMIT=2_000_000;
const encode=bytes=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(""));
const decode=value=>{
  if(typeof value!=="string"||value.length>4_000_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(value))
    throw new Error("Invalid encrypted vault encoding");
  return Uint8Array.from(atob(value),c=>c.charCodeAt(0));
};
export function validateAccountVaultPurpose(purpose){
  if(typeof purpose!=="string"||!/^[a-z][a-z0-9-]{2,39}$/.test(purpose))
    throw new Error("Invalid account vault purpose");
  return purpose;
}
export function validateAccountVaultFolder(folderId){
  if(folderId===null||folderId===undefined||folderId==="")return null;
  if(typeof folderId!=="string"||!/^[a-zA-Z0-9_-]{10,200}$/.test(folderId))
    throw new Error("Invalid Drive folder ID");
  return folderId;
}
function validateSub(sub){
  if(typeof sub!=="string"||!sub.trim()||sub.length>256)throw new Error("Google account required");
  return sub;
}
function validatePassword(passphrase){
  if(typeof passphrase!=="string"||passphrase.length<12||passphrase.length>1024)
    throw new Error("Passphrase must have 12 to 1024 characters");
  return passphrase;
}
async function digest(data){
  const bytes=await crypto.subtle.digest("SHA-256",ENCODER.encode(data));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
}
export async function accountVaultRevision(serialized){return digest(serialized)}
export async function accountVaultFileName(sub,purpose){
  validateSub(sub);validateAccountVaultPurpose(purpose);
  return "folk-v2-"+purpose+"-"+(await digest("folk:v2:account:"+purpose+":"+sub)).slice(0,24)+".enc.json";
}
async function derive(passphrase,salt){
  const material=await crypto.subtle.importKey("raw",ENCODER.encode(validatePassword(passphrase)),
    "PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",iterations:ITERATIONS,salt},
    material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
function associatedData(purpose){return ENCODER.encode("FolkNettside/v2/"+purpose+"/private-vault/v1")}
export async function encryptAccountVault(purpose,data,passphrase){
  validateAccountVaultPurpose(purpose);
  const plain=ENCODER.encode(JSON.stringify(data));
  if(plain.byteLength>LIMIT)throw new Error("Account vault too large");
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await derive(passphrase,salt);
  const encrypted=await crypto.subtle.encrypt({
    name:"AES-GCM",iv,additionalData:associatedData(purpose),tagLength:128},key,plain);
  return {format:"folk-v2-private-vault",version:1,purpose,algorithm:"AES-256-GCM",
    kdf:"PBKDF2-HMAC-SHA-256",iterations:ITERATIONS,
    salt:encode(salt),iv:encode(iv),ciphertext:encode(new Uint8Array(encrypted))};
}
export async function decryptAccountVault(purpose,envelope,passphrase){
  validateAccountVaultPurpose(purpose);
  if(!envelope||envelope.format!=="folk-v2-private-vault"||envelope.version!==1||
    envelope.purpose!==purpose||envelope.algorithm!=="AES-256-GCM"||
    envelope.kdf!=="PBKDF2-HMAC-SHA-256"||envelope.iterations!==ITERATIONS)
    throw new Error("Unsupported or mismatched private vault");
  const salt=decode(envelope.salt),iv=decode(envelope.iv),ciphertext=decode(envelope.ciphertext);
  if(salt.length!==16||iv.length!==12||ciphertext.length<16||ciphertext.length>LIMIT+16)
    throw new Error("Invalid private vault dimensions");
  const key=await derive(passphrase,salt);
  try{
    const buffer=await crypto.subtle.decrypt({
      name:"AES-GCM",iv,additionalData:associatedData(purpose),tagLength:128},key,ciphertext);
    return JSON.parse(DECODER.decode(buffer));
  }catch{
    throw new Error("Cannot unlock private vault: incorrect passphrase or damaged data. No cloud data overwritten.");
  }
}
export function verifyAccountVaultRevision(expected,current){
  if(typeof expected!=="string"||!/^[a-f0-9]{64}$/.test(expected)||expected!==current)
    throw new Error("Drive data changed since it was downloaded. Sync again; cloud data not overwritten.");
}
function ensureAccount(sub){
  const snapshot=getGoogleSessionSnapshot();
  if(snapshot.status!=="signed-in"||snapshot.profile?.sub!==sub)
    throw new Error("Google account changed or signed out. No Drive write performed.");
}
async function request(sub,url,options={}){
  ensureAccount(sub);
  const token=await getGoogleAccessToken({interactive:false});
  ensureAccount(sub);
  const headers=new Headers(options.headers||{});
  headers.set("Authorization","Bearer "+token);
  const result=await fetch(url,{...options,headers,cache:"no-store"});
  ensureAccount(sub);
  if(!result.ok)throw new Error("Google Drive HTTP "+result.status);
  return result;
}
async function locate(sub,purpose,folderId){
  const filename=await accountVaultFileName(sub,purpose);
  const folder=validateAccountVaultFolder(folderId);
  const q="name = '"+filename+"' and trashed = false and "+
    (folder?"'"+folder+"' in parents":"'root' in parents");
  const url=BASE+"?"+new URLSearchParams({q,spaces:"drive",pageSize:"100",
    fields:"nextPageToken,files(id,name,mimeType,parents,modifiedTime)",
    supportsAllDrives:"true",includeItemsFromAllDrives:"true"});
  const data=await (await request(sub,url)).json();
  if(data.nextPageToken||(data.files||[]).length>1)
    throw new Error("Multiple Drive vaults exist. Resolve duplicates before syncing.");
  return data.files?.[0]||null;
}
export async function readAccountVault(sub,purpose,passphrase,{folderId=null}={}){
  const file=await locate(sub,purpose,folderId);
  if(!file)return null;
  const response=await request(sub,BASE+"/"+encodeURIComponent(file.id)+"?alt=media&supportsAllDrives=true");
  const serialized=await response.text();
  if(serialized.length>4_000_000)throw new Error("Drive vault exceeds size limit");
  const data=await decryptAccountVault(purpose,JSON.parse(serialized),passphrase);
  return {data,file,revision:await accountVaultRevision(serialized)};
}
export async function writeAccountVault(sub,purpose,passphrase,data,{folderId=null,expectedRevision=null}={}){
  const folder=validateAccountVaultFolder(folderId);
  const existing=await locate(sub,purpose,folder);
  if(existing){
    if(!expectedRevision)throw new Error("Read and decrypt Drive data before replacing it");
    const current=await (await request(sub,BASE+"/"+encodeURIComponent(existing.id)+
      "?alt=media&supportsAllDrives=true")).text();
    if(current.length>4_000_000)throw new Error("Drive vault exceeds size limit");
    verifyAccountVaultRevision(expectedRevision,await accountVaultRevision(current));
  }else if(expectedRevision){
    throw new Error("Drive vault was removed. Sync again before creating a replacement.");
  }
  const envelope=await encryptAccountVault(purpose,data,passphrase);
  const serialized=JSON.stringify(envelope);
  ensureAccount(sub);
  if(existing){
    const response=await request(sub,UPLOAD+"/"+encodeURIComponent(existing.id)+
      "?uploadType=media&supportsAllDrives=true&fields=id,name,modifiedTime",{
        method:"PATCH",headers:{"Content-Type":"application/json"},body:serialized});
    return response.json();
  }
  const boundary="folkVault"+crypto.randomUUID().replaceAll("-","");
  const metadata={name:await accountVaultFileName(sub,purpose),mimeType:"application/json",
    description:"End-to-end encrypted FolkNettside "+purpose+" backup"};
  if(folder)metadata.parents=[folder];
  const body="--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+
    JSON.stringify(metadata)+"\r\n--"+boundary+
    "\r\nContent-Type: application/json\r\n\r\n"+serialized+"\r\n--"+boundary+"--";
  return (await request(sub,UPLOAD+"?uploadType=multipart&supportsAllDrives=true&fields=id,name,modifiedTime",{
    method:"POST",headers:{"Content-Type":"multipart/related; boundary="+boundary},body})).json();
}
