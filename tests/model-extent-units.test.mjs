import test from "node:test";
import assert from "node:assert/strict";
import {boxMesh} from "../src/hydro/fixtures.js";
import {createModelDocument} from "../src/model/model-document.js";
import {formatMeters,modelExtentMeters,unitPlausibilityAdvisory} from "../src/model/model-extent.js";
import {validateHydroModel} from "../src/model/hull-surface-validator.js";
import {hydroPreflightHTML} from "../src/engineering/hydro-panel.js";

const scaled=(mesh,factor)=>({positions:mesh.positions.map(v=>v*factor),indices:mesh.indices});
const model=(geometry,unit="meter")=>({...createModelDocument({name:"hull",format:"STL",unit,
  components:[{id:"h",name:"hull",geometry,metadata:{hydro:true}}]}),sourceType:"local-import"});

test("extent applies the unit scale and component transforms",()=>{
  const mesh=boxMesh({L:10,B:3,H:2});
  assert.deepEqual(modelExtentMeters(model(mesh)).size,[10,3,2]);
  const mm=modelExtentMeters(model(scaled(mesh,1000),"millimeter"));
  assert.ok(mm.size.every((v,i)=>Math.abs(v-[10,3,2][i])<1e-9));
  const rotated=model(mesh);
  rotated.components[0].transform=[0,1,0,0, -1,0,0,0, 0,0,1,0, 5,0,0,1]; // 90 degrees about z
  assert.deepEqual(modelExtentMeters(rotated).size.map(v=>Math.round(v*1e9)/1e9),[3,10,2]);
  assert.equal(modelExtentMeters({components:[]}),null);
  assert.equal(modelExtentMeters(model(mesh),{include:()=>false}),null);
});

test("lengths are formatted with a sensible unit",()=>{
  assert.equal(formatMeters(12.345),"12.3 m");
  assert.equal(formatMeters(0.38),"38.0 cm");
  assert.equal(formatMeters(0.0025),"2.50 mm");
  assert.equal(formatMeters(12000),"12 km");
  assert.equal(formatMeters(NaN),"—");
});

test("unit advisory only fires for sizes no vessel can have",()=>{
  const size=longest=>({longest});
  assert.equal(unitPlausibilityAdvisory(size(0.5)),null,"model-scale hull");
  assert.equal(unitPlausibilityAdvisory(size(400)),null,"large ship");
  assert.match(unitPlausibilityAdvisory(size(10000),"meter"),/10 km.*millimetres/);
  assert.match(unitPlausibilityAdvisory(size(0.005),"millimeter"),/5\.00 mm.*metres or centimetres/);
  assert.equal(unitPlausibilityAdvisory(null),null);
});

test("a millimetre STL read as metres is flagged but not blocked by the preflight",()=>{
  const mesh=boxMesh({L:10,B:3,H:2});
  const wrong=validateHydroModel(model(scaled(mesh,1000)));
  assert.equal(wrong.passed,true,"geometry is topologically fine");
  assert.equal(wrong.advisories.length,1);
  assert.match(wrong.advisories[0],/10 km/);
  const right=validateHydroModel(model(scaled(mesh,1000),"millimeter"));
  assert.deepEqual(right.advisories,[]);
  assert.deepEqual(validateHydroModel(model(mesh)).advisories,[]);
});

test("preflight panel shows the unit advisory and stays unchanged otherwise",()=>{
  const wrong=validateHydroModel(model(scaled(boxMesh({L:10,B:3,H:2}),1000)));
  assert.match(hydroPreflightHTML(wrong),/hydro-preflight-advisory[^>]*>.*Check units:.*10 km/s);
  const fine=validateHydroModel(model(boxMesh({L:10,B:3,H:2})));
  assert.doesNotMatch(hydroPreflightHTML(fine),/Check units/);
  assert.doesNotMatch(hydroPreflightHTML({passed:true,components:[],errors:[],warnings:[]}),/advisory/);
});

import {importSummary} from "../src/engineering/cad-tool.js";
import {parseSTL} from "../src/model/parsers/stl.js";

function binaryBox(scale){
  const mesh=boxMesh({L:10,B:3,H:2}),count=mesh.indices.length/3;
  const bytes=new Uint8Array(84+count*50),view=new DataView(bytes.buffer);
  view.setUint32(80,count,true);
  mesh.indices.forEach((vertex,n)=>{
    const offset=84+Math.floor(n/3)*50+12+(n%3)*12;
    for(let c=0;c<3;c++)view.setFloat32(offset+4*c,mesh.positions[3*vertex+c]*scale,true);
  });
  return bytes;
}

test("CAD import status reports unit and size and prompts when the unit looks wrong",()=>{
  const metres=importSummary(parseSTL(binaryBox(1),"hull.stl",{unit:"meter"}));
  assert.match(metres,/Imported 1 mesh components · meter · size 10\.0 m × 3\.00 m × 2\.00 m\./);
  assert.doesNotMatch(metres,/Check units/);
  const millimetres=importSummary(parseSTL(binaryBox(1000),"hull.stl",{unit:"millimeter"}));
  assert.match(millimetres,/millimeter · size 10\.0 m × 3\.00 m × 2\.00 m/);
  assert.doesNotMatch(millimetres,/Check units/);
  const wrong=importSummary(parseSTL(binaryBox(1000),"hull.stl",{unit:"meter"}));
  assert.match(wrong,/size 10 km × 3\.0 km × 2\.0 km.*Check units: .*millimetres/);
});
