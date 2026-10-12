import test from "node:test";
import assert from "node:assert/strict";
import {parseStructuralMembers} from "../src/structure/girder-section-properties.js";
import {sectionRowIndex,formatSectionMember,updateSectionRow,insertSectionMember,
 translateSectionMember,sectionDrawBounds,sectionMetersToPixel,sectionPixelToMeters}
 from "../src/engineering/section-sketch-core.js";

test("row edit/delete preserves comments, duplicates, CRLF and other station rows",()=>{
 const before="# general header\r\nplate,0,5,-2,0,2,0,.1,210,7850 # top\r\n"+
  "\r\n# another station\r\nplate,5,10,-2,0,2,0,.2,210,7850\r\n";
 assert.deepEqual(sectionRowIndex(before).map(p=>p.lineIndex),[1,4]);
 const first=parseStructuralMembers(before)[0];
 const edit=updateSectionRow(before,0,{...first,t:.15});
 assert.match(edit,/\.15,210,7850 # top\r\n/);
 assert.match(edit,/# another station\r\nplate,5,10/);
 const del=updateSectionRow(edit,1,null);
 assert.equal(parseStructuralMembers(del).length,1);
 assert.match(del,/# general header\r\n/);
 assert.throws(()=>updateSectionRow(before,9,null),/no longer exists/);
 assert.throws(()=>formatSectionMember({kind:"plate",x0:0,x1:1,t:0,E:210e9,rho:7850}),/positive/);
});

test("inserting members keeps repeated longitudinal intervals adjacent even after nested comments",()=>{
 const before="# section A\nplate,0,5,-2,0,2,0,.1,210,7850\n"+
  "# section B\nplate,5,10,-2,0,2,0,.1,210,7850\n";
 const member={kind:"stiffener",x0:0,x1:5,y:0,z:.5,width:.1,height:.2,
  E:210e9,rho:7850};
 const inserted=insertSectionMember(before,member);
 const parts=parseStructuralMembers(inserted);
 assert.equal(parts.length,3);
 assert.deepEqual(parts.map(p=>p.x0),[0,0,5]);
 assert.equal(parts[1].kind,"stiffener");
 assert.match(inserted,/# section A/);
 assert.match(inserted,/# section B/);
 const earlier=insertSectionMember(before,{...member,x0:-5,x1:0});
 assert.deepEqual(parseStructuralMembers(earlier).map(p=>p.x0),[-5,0,5]);
});

test("world Y/Z ↔ pixel mapping and dragging maintain material, thickness and X range",()=>{
 const initial={kind:"plate",x0:-5,x1:5,y0:-1,z0:.5,y1:1,z1:.5,
  t:.02,E:70e9,rho:2700};
 const moved=translateSectionMember(initial,.3,-.4);
 assert.deepEqual([moved.x0,moved.x1,moved.y0,moved.z1,moved.t,moved.E],
   [-5,5,-.7,.1,.02,70e9]);
 const b=sectionDrawBounds([initial]);
 for(const source of [{y:-1,z:.5},{y:1,z:.5},{y:0,z:0}]){
   const p=sectionMetersToPixel(source.y,source.z,b);
   const back=sectionPixelToMeters(p,b);
   assert.ok(Math.abs(back.y-source.y)<1e-12);
   assert.ok(Math.abs(back.z-source.z)<1e-12);
 }
 const fallback=sectionDrawBounds([],{min:[0,-4,-2],max:[10,4,3]});
 assert.ok(fallback.y1>4&&fallback.z0< -2);
});
