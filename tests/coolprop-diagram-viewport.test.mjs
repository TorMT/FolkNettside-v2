import test from "node:test";
import assert from "node:assert/strict";
import {zoomDiagramViewport} from "../src/tools/coolprop-diagram-viewport.js";
import {coolPropToolHTML} from "../src/tools/coolprop-tool.js";

const initial={xmin:100,xmax:500,ymin:-2,ymax:2};
test("CoolProp plot zoom preserves pointer focal point on both axes",()=>{
 const center={x:230,y:.5};
 const zoom=zoomDiagramViewport(initial,center,.8,initial);
 assert.ok(zoom);
 assert.ok(Math.abs((center.x-zoom.xmin)/(zoom.xmax-zoom.xmin)-
   (center.x-initial.xmin)/(initial.xmax-initial.xmin))<1e-12);
 assert.ok(Math.abs((center.y-zoom.ymin)/(zoom.ymax-zoom.ymin)-
   (center.y-initial.ymin)/(initial.ymax-initial.ymin))<1e-12);
 const recovered=zoomDiagramViewport(zoom,center,1.25,initial);
 for(const key of Object.keys(initial))
   assert.ok(Math.abs(recovered[key]-initial[key])<1e-10,key);
});
test("CoolProp log-pressure transformed axis can zoom without crossing invalid scales",()=>{
 const logarithmic={xmin:-100,xmax:200,ymin:-4,ymax:2};
 const next=zoomDiagramViewport(logarithmic,{x:0,y:0},.8,logarithmic);
 assert.ok(next.ymin<0&&next.ymax>0);
 assert.ok(Number.isFinite(10**next.ymin)&&Number.isFinite(10**next.ymax));
});
test("CoolProp plot rejects nonfinite and collapsed ranges",()=>{
 assert.equal(zoomDiagramViewport(initial,{x:0,y:0},0,initial),null);
 assert.equal(zoomDiagramViewport(initial,{x:Infinity,y:0},.8,initial),null);
 assert.equal(zoomDiagramViewport(initial,{x:200,y:0},Infinity,initial),null);
 assert.equal(zoomDiagramViewport({xmin:3,xmax:3,ymin:0,ymax:1},{x:3,y:0},.9,initial),null);
 let zoom={...initial};
 for(let i=0;i<100;i++){
   const next=zoomDiagramViewport(zoom,{x:200,y:0},.2,initial);
   if(next)zoom=next;
 }
 assert.ok(zoom.xmax>zoom.xmin);
 assert.ok(zoom.ymax>zoom.ymin);
 assert.ok(zoom.xmax-zoom.xmin>=400*1e-5);
});
test("diagram controls expose zoom buttons independently of pointer controls",()=>{
 const html=coolPropToolHTML({diagram:{visible:true}});
 for(const id of ["cp-diagram-zoom-in","cp-diagram-zoom-out","cp-diagram-reset"]){
   assert.match(html,new RegExp(`id="${id}"`));
 }
 assert.match(html,/aria-label="Zoom into diagram"/);
});
