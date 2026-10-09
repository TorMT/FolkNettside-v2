import test from "node:test";
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {sealBytes,ITERATIONS} from "../scripts/seal_resource.mjs";
import {assertVaultEnvelope,decryptVault,safeVaultMime} from "../src/viewers/vault-core.js";
import {viewerKind} from "../src/viewers/registry.js";

const passphrase="river-letter-cloud-piano-telescope-482";
test("offline encrypted vault can only be opened with its passphrase",async()=>{
 const plaintext=new TextEncoder().encode("Private study notes: the plaintext must not ship.");
 const packet=await sealBytes(plaintext,passphrase,{mime:"text/plain"});
 assert.equal(packet.iterations,ITERATIONS);
 assert.ok(!JSON.stringify(packet).includes("Private study"));
 assert.equal(viewerKind({path:"./examples/semesters/5/TMR4182/Kok/notes.vault.json"}),"vault");
 assert.equal(viewerKind({kind:"VAULT",path:"secret.json"}),"vault");
 const decoded=await decryptVault(packet,passphrase,{subtle:webcrypto.subtle});
 assert.deepEqual(decoded,plaintext);
 await assert.rejects(()=>decryptVault(packet,"incorrect password",{subtle:webcrypto.subtle}),/Unable to unlock/);
});
test("encrypted resource envelope refuses downgrade and ciphertext alterations",async()=>{
 const packet=await sealBytes(new Uint8Array([1,2,3]),passphrase);
 assert.equal(safeVaultMime({...packet,mime:"text/html"}),"application/octet-stream");
 assert.throws(()=>assertVaultEnvelope({...packet,iterations:1000}),/work factor/);
 assert.throws(()=>assertVaultEnvelope({...packet,cipher:"AES-CBC"}),/Unsupported/);
 const tampered={...packet,data:packet.data.slice(0,-4)+"AAAA"};
 await assert.rejects(()=>decryptVault(tampered,passphrase,{subtle:webcrypto.subtle}),/Unable to unlock|Malformed/);
});
