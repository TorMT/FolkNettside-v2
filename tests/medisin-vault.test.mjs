import test from "node:test";
import assert from "node:assert/strict";
import {
  encryptMedisinVault,decryptMedisinVault,isEncryptedMedisinVault,
  medisinVaultFileName
} from "../src/platform/medisin-vault.js";
import {newMedisinBackup} from "../src/platform/medisin-drive.js";

const backup=newMedisinBackup([{
  id:"private-entry-01",type:"timer",name:"Sensitive synthetic timer",
  updatedAt:"2026-10-10T12:00:00Z",durationSeconds:86400,
  halfLifeSeconds:0,amount:10,unit:"mg"
}]);
test("AES-GCM ciphertext is authenticated and does not reveal health entries",async()=>{
  const password="Example long encryption passphrase - not a production password!";
  const a=await encryptMedisinVault(backup,password);
  const b=await encryptMedisinVault(backup,password);
  assert.equal(isEncryptedMedisinVault(a),true);
  assert.equal(a.algorithm,"AES-256-GCM");
  assert.notEqual(a.iv,b.iv);
  assert.notEqual(a.salt,b.salt);
  assert.notEqual(a.ciphertext,b.ciphertext);
  assert.doesNotMatch(JSON.stringify(a),/Sensitive synthetic timer|private-entry-01/);
  assert.deepEqual(await decryptMedisinVault(a,password),backup);
  assert.deepEqual(await decryptMedisinVault(b,password),backup);
});
test("wrong passphrase, tampering and malicious envelope fail closed",async()=>{
  const a=await encryptMedisinVault(backup,"Correct long passphrase 0000");
  await assert.rejects(decryptMedisinVault(a,"Different long passphrase 001"),/wrong passphrase|damaged/i);
  const changed={...a,ciphertext:(a.ciphertext[0]==="A"?"B":"A")+a.ciphertext.slice(1)};
  await assert.rejects(decryptMedisinVault(changed,"Correct long passphrase 0000"),/wrong passphrase|damaged/i);
  await assert.rejects(decryptMedisinVault({...a,iterations:100}, "Correct long passphrase 0000"),/Unsupported/);
  await assert.rejects(encryptMedisinVault(backup,"short"),/12 characters/);
});
test("same account produces a deterministic pseudonymous file name, others differ",async()=>{
  const a=await medisinVaultFileName("google-sub-A");
  assert.equal(a,await medisinVaultFileName("google-sub-A"));
  assert.notEqual(a,await medisinVaultFileName("google-sub-B"));
  assert.match(a,/^folk-medisin-v2-[0-9a-f]{24}\.enc\.json$/);
  assert.doesNotMatch(a,/google-sub-A/);
  await assert.rejects(medisinVaultFileName(""),/account/);
});
