import test from "node:test";
import assert from "node:assert/strict";
import {
 suggestedGroupPath,componentGroupTree,componentGroupPath,groupMemberIds
} from "../src/model/component-groups.js";
import {cadShortcut} from "../src/model/cad-navigation.js";
import {decodeSpaceMouseReport,connectSpaceMouse,SPACE_MOUSE_VENDORS} from "../src/model/spacemouse-webhid.js";
import {explodeOffsets} from "../src/model/explode-layout.js";

const mesh={positions:[0,0,0,1,0,0,0,1,0],indices:[0,1,2]};
const model={components:[
 {id:"t-front",name:"Thruster fremre",geometry:mesh},
 {id:"t-aft",name:"Thruster bakre",geometry:mesh},
 {id:"h-front-p",name:"Fremre skrog babord",geometry:mesh},
 {id:"h-front-s",name:"Fremre skrog styrbord",geometry:mesh},
 {id:"h-aft",name:"Bakre skrog",geometry:mesh},
 {id:"anode",name:"Sacrificial anode",geometry:mesh}
]};
test("CAD group hierarchy combines shared equipment names then positional subgroups",()=>{
 assert.deepEqual(suggestedGroupPath("Fremre skrog babord"),["Skrog","Fremre","Babord"]);
 assert.deepEqual(suggestedGroupPath("Thruster bakre"),["Thruster","Bakre"]);
 assert.deepEqual(suggestedGroupPath("Thruster fremre"),["Thruster","Fremre"]);
 const tree=componentGroupTree(model);
 assert.equal(tree.total,6);
 assert.equal(tree.groups.find(g=>g.name==="Thruster").ids.length,2);
 const hull=tree.groups.find(g=>g.name==="Skrog");
 assert.equal(hull.ids.length,3);
 assert.equal(hull.groups.find(g=>g.name==="Fremre").ids.length,2);
 assert.deepEqual(new Set(groupMemberIds(model,"Skrog / Fremre")),new Set(["h-front-p","h-front-s"]));
 assert.deepEqual(new Set(groupMemberIds(model,"Thruster")),new Set(["t-front","t-aft"]));
});
test("Manual nested folder overrides do not change component geometry/source names",()=>{
 const overrides={"anode":"Skrog / Fremre / Beskyttelse"};
 const node=componentGroupTree(model,overrides);
 assert.ok(node.groups.find(g=>g.name==="Skrog").ids.includes("anode"));
 assert.deepEqual(componentGroupPath(model.components.at(-1),overrides),["Skrog","Fremre","Beskyttelse"]);
 assert.equal(model.components.at(-1).name,"Sacrificial anode");
});
test("Explode separately moves overlapping parts without changing CAD coordinates",()=>{
 const centres=[[0,0,0],[0,0,0],[0,0,0]];
 const a=explodeOffsets(centres,1,{span:2}),b=explodeOffsets(centres,1,{span:2});
 assert.deepEqual(a,b);
 assert.equal(new Set(a.map(coords=>coords.join(","))).size,3);
 assert.deepEqual(explodeOffsets(centres,0,{span:2}),[[0,0,0],[0,0,0],[0,0,0]]);
});
test("CAD keyboard is focus-independent pure mapping; modifier keys do not hijack browser hotkeys",()=>{
 assert.deepEqual(cadShortcut({key:"f"}),{action:"fit"});
 assert.deepEqual(cadShortcut({key:"I"}),{action:"iso"});
 assert.deepEqual(cadShortcut({key:"ArrowLeft",shiftKey:true}),{action:"orbit",yaw:-.1,pitch:0});
 const arrowUp=cadShortcut({key:"ArrowUp"});
 assert.equal(arrowUp.action,"pan");
 assert.ok(Math.abs(arrowUp.x)<1e-12);
 assert.ok(Math.abs(arrowUp.y-.065)<1e-12);
 assert.equal(cadShortcut({key:"f",ctrlKey:true}),null);
 assert.deepEqual(cadShortcut({key:"x"}),{action:"toggle-explode"});
});
test("SpaceMouse 6-axis HID report is signed little-endian with neutral deadzone",()=>{
 const raw=new DataView(new ArrayBuffer(6));
 raw.setInt16(0,175,true);raw.setInt16(2,-350,true);raw.setInt16(4,8,true);
 assert.deepEqual(decodeSpaceMouseReport(1,raw),{kind:"translate",values:[.5,-1,0]});
 assert.deepEqual(decodeSpaceMouseReport(2,raw),{kind:"rotate",values:[.5,-1,0]});
 assert.equal(decodeSpaceMouseReport(9,raw),null);
 assert.deepEqual(SPACE_MOUSE_VENDORS,[0x256f,0x046d]);
});
test("SpaceMouse requires user permission and ignores reports outside CAD focus",async()=>{
 class Device extends EventTarget{
   constructor(){super();this.vendorId=0x256f;this.productName="Test SpaceMouse";this.opened=false}
   async open(){this.opened=true}
   async close(){this.opened=false}
 }
 class HID extends EventTarget{
   constructor(device){super();this.device=device;this.calls=[]}
   async requestDevice(options){this.calls.push(options);return [this.device]}
 }
 const device=new Device(),hid=new HID(device);
 let focus=false,inputs=0;
 const linked=await connectSpaceMouse({hid,isActive:()=>focus,onVector:()=>{inputs++}});
 assert.equal(hid.calls.length,1);
 assert.equal(hid.calls[0].filters[0].vendorId,0x256f);
 const raw=new DataView(new ArrayBuffer(6));raw.setInt16(0,200,true);
 const report=new Event("inputreport");
 Object.defineProperties(report,{reportId:{value:1},data:{value:raw}});
 device.dispatchEvent(report);
 assert.equal(inputs,0,"HID reports must not manipulate background viewers");
 focus=true;device.dispatchEvent(report);assert.equal(inputs,1);
 await linked.disconnect();
 device.dispatchEvent(report);assert.equal(inputs,1);
 assert.equal(device.opened,false);
});
