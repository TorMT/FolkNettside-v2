import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");

test("ASV hydrostatic report is explicitly preliminary and uses correct PETG mass",()=>{
 const page=read("examples/engineering/asv-hydro.html");
 const volume=0.026443944130719415;
 const petgMass=volume*1270;
 assert.ok(Math.abs(petgMass-33.583809046013656)<1e-9);
 assert.match(page,/33,58 kg/);
 assert.match(page,/0,196 m/);
 assert.match(page,/forenklet visningsmodell/i);
 assert.match(page,/ikke inkludert i GitHub-filen/i);
 assert.match(page,/GZ-kurve/);
 assert.match(page,/SAC/);
 assert.match(page,/asv-model-canvas/);
 assert.match(page,/neddykking|vanninntrengning/i);
});

test("ASV OBJ preview parses and every triangle references a finite vertex",()=>{
 const model=read("examples/models/asv-tollak-visual-preview.obj");
 const lines=model.trim().split(/\r?\n/);
 const verts=[],triangles=[];
 for(const line of lines){
  if(line.startsWith("v ")){
   const v=line.slice(2).trim().split(/\s+/).map(Number);
   assert.equal(v.length,3);
   assert.ok(v.every(Number.isFinite));
   verts.push(v);
  }else if(line.startsWith("f ")){
   const face=line.slice(2).trim().split(/\s+/).map(Number);
   assert.equal(face.length,3);
   triangles.push(face);
  }
 }
 assert.ok(verts.length>=1000);
 assert.ok(triangles.length>=2000);
 for(const f of triangles)for(const index of f)
  assert.ok(Number.isInteger(index)&&index>=1&&index<=verts.length);
 assert.match(model,/not accurate enough for hydrostatics/i);
});

test("ASV is linked from engineering portfolio and local CAD source limits are visible",()=>{
 const projects=JSON.parse(read("data/projects.json"));
 const asv=projects.find(p=>p.slug==="asv-tollak-stability");
 assert.ok(asv);
 assert.equal(asv.modelURL,"./examples/engineering/asv-hydro.html");
 assert.ok(asv.files.some(f=>/visual-preview\.obj/.test(f.url)));
 assert.match(asv.modelNote,/ikke original|originale Fusion/i);
});
