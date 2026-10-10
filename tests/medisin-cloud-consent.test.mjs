import test from "node:test";
import assert from "node:assert/strict";
import {
  medisinCloudConsentKey,medisinCloudSyncAllowed,setMedisinCloudSyncAllowed
} from "../src/platform/medisin-cloud-consent.js";

function memoryStore(){
  const data=new Map();
  return {getItem:key=>data.get(key)||null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key)};
}
test("Google sign-in alone never allows plaintext health data to upload",()=>{
  const storage=memoryStore();
  assert.equal(medisinCloudSyncAllowed("account-A",storage),false);
  assert.equal(medisinCloudSyncAllowed("",storage),false);
  assert.equal(medisinCloudConsentKey(""),null);
  assert.throws(()=>setMedisinCloudSyncAllowed("",true,storage),/account/i);
});
test("MedisinTimer cloud consent is explicit and isolated per Google account",()=>{
  const storage=memoryStore();
  assert.equal(setMedisinCloudSyncAllowed("sub-A",true,storage),true);
  assert.equal(medisinCloudSyncAllowed("sub-A",storage),true);
  assert.equal(medisinCloudSyncAllowed("sub-B",storage),false);
  assert.equal(setMedisinCloudSyncAllowed("sub-A",false,storage),false);
  assert.equal(medisinCloudSyncAllowed("sub-A",storage),false);
});
test("Invalid/blocked localStorage defaults to no cloud syncing",()=>{
  const broken={getItem(){throw Error("blocked")},setItem(){throw Error("blocked")}};
  assert.equal(medisinCloudSyncAllowed("sub-A",broken),false);
  assert.throws(()=>setMedisinCloudSyncAllowed("sub-A",true,broken),/Could not save/);
});
