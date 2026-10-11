import test from "node:test";
import assert from "node:assert/strict";
import {
  dataBounds,diagramDatasets,diagramType,generateIsobars,generateIsotherms,generateQualityLines,generateSaturationCurve,
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


test("auxiliary CoolProp curves do not blow out diagram auto bounds",()=>{
  const datasets=[
    {kind:"states",affectsBounds:true,points:[{x:100,y:1},{x:200,y:2}]},
    {kind:"isotherm",affectsBounds:false,points:[{x:-5000,y:.0001},{x:9000,y:5000}]}
  ];
  const bounds=dataBounds(datasets,{logY:true});
  assert.ok(bounds.xmin>0);
  assert.ok(bounds.xmax<300);
  assert.ok(bounds.ymin>.1);
  assert.ok(bounds.ymax<10);
});

test("generated helper curves mark phase changes as discontinuities",()=>{
  let calls=0;
  const fake={
    props1SI(fluid,key){return {Tcrit:500,Pcrit:5e6,Ttriple:200}[key]},
    propsSI(out,k1,v1,k2,v2){
      const T=k1==="T"?v1:v2;
      const P=k1==="P"?v1:v2;
      if(out==="Phase")return P>1e6?0:5;
      if(out==="H")return T*1000+(P>1e6?1e6:0);
      if(out==="S")return T*10;
      if(out==="D")return P>1e6?800:2;
      return 0;
    },
    phaseSI(k1,v1,k2,v2){calls++;const P=k1==="P"?v1:v2;return P>1e6?"liquid":"gas"}
  };
  const lines=generateIsotherms(fake,"Water","ph",{lines:2,points:20});
  assert.ok(calls>0);
  assert.ok(lines.some(line=>line.points.some(point=>point.breakBefore)));
});

test("diagram datasets keep saturation and states as bound-driving data only",()=>{
  const sets=diagramDatasets(engine(),"Water","ph",[{valuesSI:{P:2e5,H:500000,S:7000,T:350,D:2}}],{
    isotherms:true,isobars:true,quality:true
  });
  assert.ok(sets.some(set=>set.kind==="states"&&set.affectsBounds===true));
  assert.ok(sets.some(set=>set.kind==="saturation"&&set.affectsBounds===true));
  assert.ok(sets.some(set=>set.kind==="isotherm"&&set.affectsBounds===false));
  assert.ok(sets.some(set=>set.kind==="isobar"&&set.affectsBounds===false));
});


test("diagram datasets expose a critical-point marker from the saturation dome",()=>{
  const sets=diagramDatasets(engine(),"Water","ph",[],{isotherms:false,isobars:false,quality:false});
  const critical=sets.find(set=>set.kind==="critical");
  assert.ok(critical);
  assert.equal(critical.label,"Critical point");
  assert.equal(critical.points.length,1);
  assert.ok(Number.isFinite(critical.points[0].x));
  assert.ok(Number.isFinite(critical.points[0].y));
});

test("diagram rejects absent/null/empty/nonphysical values instead of plotting fake zero states",()=>{
  for(const missing of [null,undefined,"", "  ",true]){
    assert.equal(stateToDiagramPoint({P:1e5,H:missing},"ph"),null);
    assert.equal(stateToDiagramPoint({S:missing,T:300},"ts"),null);
    assert.equal(stateToDiagramPoint({P:1e5,D:missing},"pv"),null);
  }
  assert.equal(stateToDiagramPoint({P:1e5,H:0},"ph").x,0,
    "A real zero-enthalpy reference is permitted");
  assert.equal(stateToDiagramPoint({S:0,T:273.15},"ts").y,0,
    "A real 0 Celsius temperature and 0 entropy reference are permitted");
  assert.equal(stateToDiagramPoint({S:1000,T:0},"ts"),null,
    "Zero kelvin is not a physical plotted temperature");
});

test("unsupported saturation parameters do not erase measured single-phase diagram points",()=>{
  const noSaturation={
    props1SI(){throw Error("Saturation unavailable for this state model")},
    propsSI(){throw Error("Saturation unavailable")}
  };
  const states=[{valuesSI:{P:250000,H:320000,T:325,S:1750,D:4}}];
  const datasets=diagramDatasets(noSaturation,"Air","log-ph",states);
  assert.equal(datasets.some(set=>set.kind==="saturation"),false);
  assert.equal(datasets.some(set=>set.kind==="quality"),false);
  const measured=datasets.find(set=>set.kind==="states");
  assert.deepEqual(measured.points,[{x:320,y:2.5,label:"1"}]);
  const bounds=dataBounds(datasets,{logY:true});
  assert.ok(bounds.xmin<320&&bounds.xmax>320);
  assert.ok(bounds.ymin<2.5&&bounds.ymax>2.5);
});
