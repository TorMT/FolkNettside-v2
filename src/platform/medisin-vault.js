/**
 * End-to-end encryption for MedisinTimer Drive backups.
 * PBKDF2-HMAC-SHA-256 (310,000 iterations) -> AES-256-GCM.
 * Encryption/decryption occurs only in the user's browser. Passwords and
 * derived keys must never be placed in localStorage, Drive or Git.
 */
const FORMAT="folk-medisin-vault";
const VERSION=1;
const ITERATIONS=310000;
const AAD=new TextEncoder().encode("FolkNettside/MedisinTimer/vault/v1");
const encoder=new TextEncoder();
const decoder=new TextDecoder("utf-8",{fatal:true});
const b64=bytes=>btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(""));
const unb64=value=>{
  if(typeof value!=="string"||!value||value.length>4000000||!/^[A-Za-z0-9+/]+={0,2}$/.test(value))
    throw new Error("Invalid encrypted vault encoding");
  const string=atob(value);
  return Uint8Array.from(string,ch=>ch.charCodeAt(0));
};
const subtle=()=>{
  if(!globalThis.crypto?.subtle||!globalThis.crypto?.getRandomValues)
    throw new Error("Encrypted Drive backups require HTTPS and Web Crypto");
  return globalThis.crypto.subtle;
};
function validatePassphrase(passphrase){
  if(typeof passphrase!=="string"||passphrase.length<12||passphrase.length>1024)
    throw new Error("Use a passphrase of at least 12 characters (maximum 1024).");
  return passphrase;
}
async function keyFor(passphrase,salt){
  const base=await subtle().importKey("raw",encoder.encode(validatePassphrase(passphrase)),
    "PBKDF2",false,["deriveKey"]);
  return subtle().deriveKey({name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},
    base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
export function isEncryptedMedisinVault(value){
  return Boolean(value&&typeof value==="object"&&value.format===FORMAT&&value.version===VERSION);
}
function validateEnvelope(value){
  if(!isEncryptedMedisinVault(value)||value.algorithm!=="AES-256-GCM"||
     value.kdf!=="PBKDF2-HMAC-SHA-256"||value.iterations!==ITERATIONS)
    throw new Error("Unsupported or incomplete encrypted MedisinTimer vault");
  const salt=unb64(value.salt),iv=unb64(value.iv),ciphertext=unb64(value.ciphertext);
  if(salt.length!==16||iv.length!==12||ciphertext.length<16||ciphertext.length>3000016)
    throw new Error("Invalid encrypted MedisinTimer vault size or nonce");
  return {salt,iv,ciphertext};
}
export async function encryptMedisinVault(backup,passphrase){
  const plain=encoder.encode(JSON.stringify(backup));
  if(plain.byteLength>2_000_000)throw new Error("MedisinTimer backup too large");
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await keyFor(passphrase,salt);
  const encrypted=await subtle().encrypt({name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,plain);
  return {format:FORMAT,version:VERSION,kdf:"PBKDF2-HMAC-SHA-256",
    iterations:ITERATIONS,algorithm:"AES-256-GCM",
    salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(encrypted))};
}
export async function decryptMedisinVault(envelope,passphrase){
  const {salt,iv,ciphertext}=validateEnvelope(envelope);
  const key=await keyFor(passphrase,salt);
  let plain;
  try{
    plain=await subtle().decrypt({name:"AES-GCM",iv,additionalData:AAD,tagLength:128},key,ciphertext);
  }catch{
    throw new Error("Vault could not be unlocked: wrong passphrase or damaged encrypted data. No cloud data was overwritten.");
  }
  try{return JSON.parse(decoder.decode(plain))}
  catch{throw new Error("Decrypted MedisinTimer vault does not contain valid JSON.")}
}
export async function medisinVaultFileName(accountSub){
  if(typeof accountSub!=="string"||!accountSub.trim()||accountSub.length>256)
    throw new Error("Google account required for private vault filename");
  const digest=await subtle().digest("SHA-256",encoder.encode("folk-medisin-vault-account:"+accountSub));
  const suffix=Array.from(new Uint8Array(digest).slice(0,12),b=>b.toString(16).padStart(2,"0")).join("");
  return "folk-medisin-v2-"+suffix+".enc.json";
}
