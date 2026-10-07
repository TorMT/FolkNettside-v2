import test from "node:test";
import assert from "node:assert/strict";
import {
  dataBounds,diagramType,generateIsotherms,generateQualityLines,generateSaturationCurve,
  stateToDiagramPoint
} from "../src/tools/coolprop-diagram-core.js";

function engine(){
  return {
    props1SI(fluid,key){
      return {Tcrit:500,Pcrit:5e6,Ttriple:200}[key];
    },
    propsSI(out,k1,v1,k2,v2){
      const T=k1==="T"?v1:k2==="T"?v2:300;
      const Q=k1==="Q"?v1:k2==="Q"?v2:.5;
      const P=k1==="P"?v1:k2==="P"?v2:(1e5+T*5000);
      const D=900-(T-200)*1.2-Q*700;
      const values={P,H:T*1000+Q*1e6,S:T*10+Q*5000,D:Math.max(1,D)};
      return values[out];
    }
  };
}

test("diagram state transforms cover all legacy diagram types",()=>{
  const state={valuesSI:{P:2e5,H:500000,S:7000,T:350,D:2}};
  assert.deepEqual(stateToDiagramPoint(state,"ph"),{x:500,y:2});
  assert.deepEqual(stateToDiagramPoint(state,"log-ph"),{x:500,y:2});
  assert.deepEqual(stateToDiagramPoint(state,"ts"),{x:7,y:76.85000000000002});
  assert.deepEqual(stateToDiagramPoint(state,"pv"),{x:.5,y:2});
});

test("diagram metadata preserves four legacy diagram choices",()=>{
  assert.equal(diagramType("log-ph").logY,true);
  assert.equal(diagramType("ph").logY,false);
  assert.equal(diagramType("ts").xLabel.includes("entropy"),true);
  assert.equal(diagramType("pv").xLabel.includes("volume"),true);
});

test("saturation and quality curves are generated from the engine",()=>{
  const sat=generateSaturationCurve(engine(),"Water","ph",{points:12});
  assert.ok(sat.liquid.length>=10);
  assert.ok(sat.vapor.length>=10);
  const quality=generateQualityLines(engine(),"Water","ts",{qualities:[.5],points:10});
  assert.equal(quality.length,1);
  assert.ok(quality[0].points.length>=8);
});

test("data bounds support logarithmic pressure axes",()=>{
  const bounds=dataBounds([{points:[{x:1,y:.1},{x:4,y:100}]}],{logY:true});
  assert.ok(bounds.xmin<1&&bounds.xmax>4);
  assert.ok(bounds.ymin>0&&bounds.ymin<.1&&bounds.ymax>100);
});


test("Air diagram curves use the same table-reference basis as state points",()=>{
  const raw=generateIsotherms(engine(),"Air","ph",{lines:2,points:3,bookBasis:false});
  const book=generateIsotherms(engine(),"Air","ph",{lines:2,points:3,bookBasis:true});
  assert.equal(raw.length,book.length);
  assert.ok(raw.length>0);
  const rawX=raw[0].points[0].x;
  const bookX=book[0].points[0].x;
  assert.notEqual(bookX,rawX);
  const deltas=[];
  for(let i=0;i<raw.length;i++){
    for(let j=0;j<raw[i].points.length;j++){
      deltas.push(book[i].points[j].x-raw[i].points[j].x);
    }
  }
  for(const delta of deltas)assert.ok(Math.abs(delta-deltas[0])<1e-9);
});
