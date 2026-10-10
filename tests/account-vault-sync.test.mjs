import test from "node:test";
import assert from "node:assert/strict";
import {
 accountVaultFileName,encryptAccountVault,decryptAccountVault,
 accountVaultRevision,verifyAccountVaultRevision,validateAccountVaultFolder
} from "../src/platform/account-vault-sync.js";

const pass="A unique synthetic test phrase for cloud vault 2026";
const sample={schemaVersion:1,entries:[{id:"synthetic",name:"Sample private content"}]};
test("account vault encrypts with independent salt/IV, restores and binds purpose",async()=>{
 const a=await encryptAccountVault("dive-log",sample,pass);
 const b=await encryptAccountVault("dive-log",sample,pass);
 assert.notEqual(a.salt,b.salt);
 assert.notEqual(a.iv,b.iv);
 assert.doesNotMatch(JSON.stringify(a),/Sample private content/);
 assert.deepEqual(await decryptAccountVault("dive-log",a,pass),sample);
 await assert.rejects(decryptAccountVault("brew-inventory",a,pass),/mismatched/);
 await assert.rejects(decryptAccountVault("dive-log",a,"Incorrect synthetic password"),/Cannot unlock/);
 const tampered={...a,ciphertext:(a.ciphertext[0]==="A"?"B":"A")+a.ciphertext.slice(1)};
 await assert.rejects(decryptAccountVault("dive-log",tampered,pass),/Cannot unlock/);
});
test("account, purpose, folder IDs and stale revision protections",async()=>{
 const name=await accountVaultFileName("account-sub-123","dive-log");
 assert.match(name,/^folk-v2-dive-log-[a-f0-9]{24}\.enc\.json$/);
 assert.notEqual(name,await accountVaultFileName("account-sub-456","dive-log"));
 assert.notEqual(name,await accountVaultFileName("account-sub-123","brew-inventory"));
 assert.equal(validateAccountVaultFolder("abcdef1234567890"),"abcdef1234567890");
 assert.equal(validateAccountVaultFolder(""),null);
 assert.throws(()=>validateAccountVaultFolder("https://drive.google.com/file"),/folder/);
 const original=await accountVaultRevision("ciphertext-original");
 const changed=await accountVaultRevision("ciphertext-changed");
 assert.doesNotThrow(()=>verifyAccountVaultRevision(original,original));
 assert.throws(()=>verifyAccountVaultRevision(original,changed),/changed since/);
 assert.throws(()=>verifyAccountVaultRevision(null,changed),/changed since/);
});
