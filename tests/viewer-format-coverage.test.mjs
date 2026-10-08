import test from "node:test";
import assert from "node:assert/strict";
import {viewerKind,viewerFormatCoverage,loadAdapter} from "../src/viewers/registry.js";
import {modelDocumentFromThree} from "../src/viewers/three-model-import.js";
import {formatGuidance} from "../src/viewers/adapters/conversion.js";

const native={
  pdf:"pdf",docx:"office",xlsx:"office",pptx:"office",
  stl:"stl","3mf":"three-mf",f3d:"fusion",f3z:"fusion",
  obj:"obj",glb:"gltf",gltf:"gltf",py:"python",ipynb:"notebook",
  tex:"latex",html:"html",csv:"csv",tsv:"csv",psv:"csv",
  zip:"archive",png:"image",svg:"image",webp:"image",mp3:"audio",wav:"audio",
  mp4:"video",md:"text",json:"text",js:"text",step:"conversion",sldprt:"conversion"
};
test("all key course file types map to specific working viewer modules",async()=>{
  for(const [ext,expected] of Object.entries(native)){
    const resource={kind:"FILE",path:"./courses/file."+ext};
    assert.equal(viewerKind(resource),expected,ext);
    const adapter=await loadAdapter(resource);
    assert.equal(adapter.kind,expected,ext);
    assert.equal(typeof adapter.render,"function",ext+" is not a viewer");
  }
});
test("unknown or unsafe binary files never get decoded as Python or text",async()=>{
  for(const ext of ["exe","7z","rar","bin","unknownformat"]){
    const actual=viewerKind({path:"/file."+ext});
    assert.equal(actual,"unsupported",ext);
    const adapter=await loadAdapter({path:"/file."+ext});
    assert.equal(adapter.kind,"unsupported");
  }
  assert.equal(viewerKind({kind:"QUIZ",path:"q.json"}),"quiz");
  assert.equal(viewerKind({kind:"YOUTUBE",url:"https://youtu.be/example"}),"youtube");
});
test("every configured extension targets an existing importable adapter",async()=>{
  const entries=Object.entries(viewerFormatCoverage());
  assert.ok(entries.length>75);
  for(const [ext,kind] of entries){
    const adapter=await loadAdapter({path:"sample."+ext});
    assert.equal(adapter.kind,kind);
  }
});
test("Three mesh import applies world matrix and disallows empty/nontriangular files",()=>{
  const geometry={attributes:{position:{
    itemSize:3,count:3,getX:index=>[0,1,0][index],
    getY:index=>[0,0,1][index],getZ:()=>0
  }},index:null};
  const mesh={isMesh:true,name:"Triangles",geometry,
    matrixWorld:{elements:[1,0,0,0,0,1,0,0,0,0,1,0,3,4,5,1]}};
  const scene={updateMatrixWorld(){},traverse(cb){cb(mesh)}};
  const model=modelDocumentFromThree({scene,format:"OBJ"});
  assert.deepEqual(model.components[0].geometry.positions,[3,4,5,4,4,5,3,5,5]);
  assert.deepEqual(model.components[0].geometry.indices,[0,1,2]);
  assert.equal(model.visualPreviewOnly,true);
  assert.throws(()=>modelDocumentFromThree({scene:{updateMatrixWorld(){},traverse(){}}}),/no triangulated/);
});
test("CAD conversion notices do not claim true geometry from non-mesh data",()=>{
  assert.match(formatGuidance("step"),/tessellation/);
  assert.match(formatGuidance("sldprt"),/tessellation/);
  assert.match(formatGuidance("xls"),/PDF/);
  assert.match(formatGuidance("heic"),/JPEG/);
});
