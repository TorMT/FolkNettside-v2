/** Static encrypted file support. No password verifier or plaintext is shipped. */
const AAD="FolkNettside-v2-vault-v1";
const encoder=new TextEncoder();
function decodeB64(value,max=36_000_000){
 if(typeof value!=="string"||value.length>Math.ceil(max*4/3)+16||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))
   throw new Error("Invalid or oversized encrypted resource");
 const bytes=atob(value);
 if(bytes.length>max)throw new Error("Encrypted resource exceeds size limit");
 return Uint8Array.from(bytes,c=>c.charCodeAt(0));
}
export function assertVaultEnvelope(vault){
 if(!vault||vault.format!=="folk-vault-v1"||vault.kdf!=="PBKDF2-SHA256"||vault.cipher!=="AES-256-GCM")
   throw new Error("Unsupported encrypted resource format");
 if(!Number.isSafeInteger(vault.iterations)||vault.iterations<600_000||vault.iterations>2_000_000)
   throw new Error("Unsupported PBKDF2 work factor");
 const salt=decodeB64(vault.salt,64),iv=decodeB64(vault.iv,32);
 const data=decodeB64(vault.data,27_000_000);
 if(salt.length!==16||iv.length!==12||data.length<17)
   throw new Error("Malformed encrypted resource");
 return {salt,iv,data};
}
export async function decryptVault(vault,passphrase,{subtle=globalThis.crypto?.subtle}={}){
 const {salt,iv,data}=assertVaultEnvelope(vault);
 if(typeof passphrase!=="string"||!passphrase)throw new Error("Passphrase required");
 if(!subtle)throw new Error("Secure browser context required (HTTPS or localhost)");
 const keyMaterial=await subtle.importKey("raw",encoder.encode(passphrase),
   "PBKDF2",false,["deriveKey"]);
 const key=await subtle.deriveKey({name:"PBKDF2",salt,
   iterations:vault.iterations,hash:"SHA-256"},keyMaterial,
   {name:"AES-GCM",length:256},false,["decrypt"]);
 try{
   return new Uint8Array(await subtle.decrypt({
     name:"AES-GCM",iv,additionalData:encoder.encode(AAD)
   },key,data));
 }catch{
   throw new Error("Unable to unlock: incorrect passphrase or damaged encrypted data");
 }
}
export function safeVaultMime(vault){
 const type=String(vault.mime||"application/octet-stream").toLowerCase().split(";")[0];
 const allowed=new Set(["application/pdf","text/plain","text/markdown","text/csv","application/json",
  "image/png","image/jpeg","image/webp","image/gif","application/octet-stream"]);
 return allowed.has(type)?type:"application/octet-stream";
}

const b64=bytes=>btoa(String.fromCharCode(...bytes));
export async function encryptVault(bytes,passphrase,{mime="application/octet-stream",subtle=globalThis.crypto?.subtle,random=globalThis.crypto}={}){
 if(!subtle||!random?.getRandomValues)throw new Error("HTTPS secure context required");
 if(typeof passphrase!=="string"||passphrase.length<20)throw new Error("Use a long, randomly generated passphrase (20+ characters)");
 const content=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 if(!content.byteLength||content.byteLength>25*1024*1024)throw new Error("Choose a nonempty file under 25 MiB");
 const salt=random.getRandomValues(new Uint8Array(16)),iv=random.getRandomValues(new Uint8Array(12));
 const keyMaterial=await subtle.importKey("raw",encoder.encode(passphrase),"PBKDF2",false,["deriveKey"]);
 const key=await subtle.deriveKey({name:"PBKDF2",salt,iterations:600_000,hash:"SHA-256"},keyMaterial,{name:"AES-GCM",length:256},false,["encrypt"]);
 const contentType=safeVaultMime({mime});
 const result=await subtle.encrypt({name:"AES-GCM",iv,additionalData:encoder.encode(AAD)},key,content);
 const cipher=new Uint8Array(result);
 const output={format:"folk-vault-v1",kdf:"PBKDF2-SHA256",iterations:600_000,cipher:"AES-256-GCM",
   salt:b64(salt),iv:b64(iv),data:b64(cipher),mime:contentType};
 assertVaultEnvelope(output);
 return output;
}
