import test from "node:test";
import assert from "node:assert/strict";
import {SPACE_MOUSE_DEFAULTS,normaliseSpaceMouseSettings,
  readSpaceMouseSettings,writeSpaceMouseSettings,resetSpaceMouseSettings} from "../src/model/spacemouse-settings.js";
import {spaceMouseMovement} from "../src/model/spacemouse-motion.js";
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} vs ${b}`);
function storage(){
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,v)=>values.set(key,v),
   removeItem:key=>values.delete(key)};
}
test("site SpaceMouse defaults are Fusion-like object nav with enabled 6DoF",()=>{
 const def=normaliseSpaceMouseSettings();
 assert.deepEqual(def,{...SPACE_MOUSE_DEFAULTS});
 assert.equal(def.navigation,"object");
 assert.equal(def.panZoom,true);
 assert.equal(def.rotation,true);
 assert.equal(def.roll,true);
});
test("SpaceMouse preferences persist safely and reset to defaults",()=>{
 const memory=storage();
 assert.equal(readSpaceMouseSettings(memory).navigation,"object");
 writeSpaceMouseSettings({navigation:"camera",invertSpin:true,deadzone:.07},memory);
 assert.equal(readSpaceMouseSettings(memory).navigation,"camera");
 assert.equal(readSpaceMouseSettings(memory).invertSpin,true);
 resetSpaceMouseSettings(memory);
 assert.equal(readSpaceMouseSettings(memory).navigation,"object");
 assert.equal(readSpaceMouseSettings(memory).invertSpin,false);
});
test("malformed SpaceMouse settings are clamped and unknown keys never persisted",()=>{
 const values=normaliseSpaceMouseSettings({navigation:"unsafe",deadzone:-1,
   sensitivity:500,rotationSpeed:"bad",invertRoll:1,malware:"hello"});
 assert.equal(values.navigation,"object");
 assert.equal(values.deadzone,0);
 assert.equal(values.sensitivity,2);
 assert.equal(values.rotationSpeed,1);
 assert.equal(values.invertRoll,false);
 assert.equal("malware" in values,false);
});
test("all six SpaceMouse axis reversals preserve other channels",()=>{
 const motion=spaceMouseMovement({kind:"translate",values:[.7,.8,.9]},
   {sensitivity:1,panSpeed:1,deadzone:0});
 const flip=spaceMouseMovement({kind:"translate",values:[.7,.8,.9]},
   {sensitivity:1,deadzone:0,invertPanX:true,invertPanY:true,invertZoom:true});
 near(motion.pan[0],-flip.pan[0]);near(motion.pan[1],-flip.pan[1]);
 near(motion.zoom*flip.zoom,1);
 const base=spaceMouseMovement({kind:"rotate",values:[.7,.8,.9]},
   {sensitivity:1,deadzone:0});
 const inv=spaceMouseMovement({kind:"rotate",values:[.7,.8,.9]},
   {sensitivity:1,deadzone:0,invertTilt:true,invertSpin:true,invertRoll:true});
 assert.deepEqual(base.orbit,inv.orbit.map(x=>-x));
});
test("rotation lock, pan/zoom lock, deadzone and camera mode work",()=>{
 const v={kind:"translate",values:[.5,.7,.2]};
 assert.equal(spaceMouseMovement(v,{panZoom:false}),null);
 assert.equal(spaceMouseMovement({kind:"rotate",values:[1,0,0]},{rotation:false}),null);
 const locked=spaceMouseMovement({kind:"rotate",values:[1,1,1]},{roll:false});
 assert.equal(locked.orbit[2],0);
 const dead=spaceMouseMovement({kind:"rotate",values:[.01,.01,.01]},{deadzone:.1});
 assert.deepEqual(dead.orbit,[0,0,0]);
 const obj=spaceMouseMovement(v,{navigation:"object"});
 const cam=spaceMouseMovement(v,{navigation:"camera"});
 near(obj.pan[0],-cam.pan[0]);near(obj.pan[1],-cam.pan[1]);
 near(obj.zoom*cam.zoom,1);
});
