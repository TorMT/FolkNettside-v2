import {webcrypto} from "node:crypto";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {basename,dirname,resolve} from "node:path";
import {createInterface} from "node:readline/promises";
import {stdin as input,stdout as output} from "node:process";

export const ITERATIONS=600_000;
const encoder=new TextEncoder();
function b64(bytes){return Buffer.from(bytes).toString("base64")}
export async function sealBytes(bytes,passphrase,{filename="",mime="application/octet-stream",iterations=ITERATIONS}={}){
 if(!(typeof passphrase==="string"&&passphrase.length>=20))
   throw new Error("Passphrase must contain at least 20 characters; use a randomly generated phrase");
 if(!Number.isSafeInteger(iterations)||iterations<ITERATIONS)
   throw new Error("PBKDF2 iterations must be at least "+ITERATIONS);
 const salt=webcrypto.getRandomValues(new Uint8Array(16));
 const iv=webcrypto.getRandomValues(new Uint8Array(12));
 const material=await webcrypto.subtle.importKey("raw",encoder.encode(passphrase),"PBKDF2",false,["deriveKey"]);
 const key=await webcrypto.subtle.deriveKey({name:"PBKDF2",salt,iterations,hash:"SHA-256"},material,
   {name:"AES-GCM",length:256},false,["encrypt"]);
 const ciphertext=await webcrypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:encoder.encode("FolkNettside-v2-vault-v1")},key,bytes);
 return {format:"folk-vault-v1",kdf:"PBKDF2-SHA256",iterations,
   cipher:"AES-256-GCM",salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(ciphertext)),
   // The filename is a visible label only. Avoid revealing sensitive filenames.
   label:filename?basename(filename):"Encrypted resource",mime};
}
async function main(){
 const [file,destination,...extras]=process.argv.slice(2);
 if(!file||!destination||extras.length||file===destination){
   throw new Error("Usage: node scripts/seal_resource.mjs <local-source-file> <public-output.vault.json> (passphrase requested interactively)");
 }
 if(!destination.toLowerCase().endsWith(".vault.json"))
   throw new Error("Output must use .vault.json");
 if(!process.stdin.isTTY)throw new Error("Interactive terminal required; never supply passphrase via CLI args/env");
 const rl=createInterface({input,output,terminal:true});
 try{
   const phrase=await rl.question("Strong passphrase (20+ characters; not stored): ");
   const again=await rl.question("Repeat passphrase: ");
   if(phrase!==again)throw new Error("Passphrases differ; no output produced");
   const source=await readFile(file);
   if(source.byteLength>25*1024*1024)throw new Error("Maximum vault input is 25 MB");
   const ext=basename(file).toLowerCase().split(".").pop();
   const mime=({pdf:"application/pdf",txt:"text/plain",md:"text/markdown",
     csv:"text/csv",json:"application/json",png:"image/png",jpg:"image/jpeg",
     jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif"})[ext]||"application/octet-stream";
   const vault=await sealBytes(source,phrase,{mime});
   const finalPath=resolve(destination);
   await mkdir(dirname(finalPath),{recursive:true});
   await writeFile(finalPath,JSON.stringify(vault)+"\n",{flag:"wx",mode:0o600});
   console.log("Encrypted file written:",finalPath,"\nNever publish the unencrypted source.");
 }finally{rl.close()}
}
if(process.argv[1]&&process.argv[1].endsWith("seal_resource.mjs"))
 main().catch(error=>{console.error(error.message);process.exitCode=1});
