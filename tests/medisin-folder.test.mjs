import test from "node:test";
import assert from "node:assert/strict";
import {validMedisinDriveFolder} from "../src/platform/medisin-encrypted-drive.js";
import {medisinDriveFolder,setMedisinDriveFolder} from "../src/platform/medisin-folder.js";
function store(){
 const m=new Map();
 return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
}
test("Encrypted vault supports a shared Drive folder, scoped per account",()=>{
 const storage=store(),folder="1Aa-bBb_Cc2345678";
 assert.equal(validMedisinDriveFolder(folder),folder);
 assert.equal(medisinDriveFolder("sub-A",storage),null);
 setMedisinDriveFolder("sub-A",folder,storage);
 assert.equal(medisinDriveFolder("sub-A",storage),folder);
 assert.equal(medisinDriveFolder("sub-B",storage),null);
 setMedisinDriveFolder("sub-A","",storage);
 assert.equal(medisinDriveFolder("sub-A",storage),null);
});
test("Invalid shared-folder identifiers fail closed and cannot create URLs",()=>{
 const storage=store();
 for(const id of ["https://drive.google.com/drive/folders/1234567890",
  "../includes/", "/", "abc?x=1", "with spaces", "short", "x".repeat(201)]){
  assert.throws(()=>setMedisinDriveFolder("sub-A",id,storage),/mappe-ID/);
 }
 assert.throws(()=>setMedisinDriveFolder("", "folderId123456",storage),/Logg inn/);
});
