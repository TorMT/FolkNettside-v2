import test from "node:test";
import assert from "node:assert/strict";
import {
  fusionArchiveInventory,parseFusionArchive,selectFusionArchiveCandidate,
  selectFusionArchiveCandidates,selectSemanticManifestCandidate
} from "../src/model/parsers/fusion-archive.js";
import {describeFusionPackagePaths,inspectFusionPackage,previewCandidates}
  from "../src/model/parsers/fusion-preview.js";
import {isArchiveJunk,withoutArchiveJunk} from "../src/model/parsers/archive-paths.js";
import {loadTestJSZip,makeArchive} from "./helpers/jszip-for-tests.mjs";

const {JSZip}=await loadTestJSZip();
const APPLE_DOUBLE=Uint8Array.from([0,5,22,7,0,2,0,0,77,97,99,32,79,83,32,88]);
const PNG=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,0]);
const stl=(offset=0)=>`solid body
facet normal 0 0 1
 outer loop
  vertex ${offset} 0 0
  vertex ${offset+1} 0 0
  vertex ${offset} 1 0
 endloop
endfacet
endsolid body
`;
const archive=files=>makeArchive(JSZip,files);
const parse=(buffer,name="design.f3z")=>parseFusionArchive(buffer,name,0,{JSZip});

test("operating-system bookkeeping files are recognised as junk",()=>{
  for(const path of ["__MACOSX/hull.stl","__MACOSX/Munin/._hull.stl","._hull.stl","Munin/._hull.stl",
    ".DS_Store","dir/.DS_Store","Thumbs.db","sub\\Thumbs.db","desktop.ini"])
    assert.equal(isArchiveJunk(path),true,path);
  for(const path of ["hull.stl","dir/hull.stl","my._hull.stl","MACOSX/hull.stl","Previews/small.png",""])
    assert.equal(isArchiveJunk(path),false,path);
  assert.deepEqual(withoutArchiveJunk(["a.stl","__MACOSX/._a.stl",".DS_Store"]),["a.stl"]);
});

test("junk entries are never import candidates, even though they sort first and end in .stl",()=>{
  const paths=["__MACOSX/._wedge.stl","wedge.stl"];
  assert.equal(selectFusionArchiveCandidate(paths),"wedge.stl");
  assert.equal(selectFusionArchiveCandidate(["__MACOSX/._wedge.stl","._model.3mf"]),null);
  assert.deepEqual(selectFusionArchiveCandidates(["b.stl","a.3mf","c.step","a.stl"]).map(c=>c.path),
    ["a.3mf","a.stl","b.stl","c.step"]);
});

test("inventory, semantic sidecar and package description ignore junk",()=>{
  const paths=["a.stl","__MACOSX/._a.stl","__MACOSX/._folknet-semantic.json","Previews/._small.png","Previews/small.png"];
  assert.equal(fusionArchiveInventory(paths).stl,1);
  assert.equal(fusionArchiveInventory(paths).entries,2);
  assert.equal(selectSemanticManifestCandidate(["__MACOSX/folknet-semantic.json"]),null);
  const described=describeFusionPackagePaths(paths);
  assert.deepEqual(described.neutral,["a.stl"]);
  assert.deepEqual(previewCandidates(paths),["Previews/small.png"]);
});

test("F3Z zipped on macOS imports the real STL, not its AppleDouble stub",async()=>{
  const model=await parse(await archive({"wedge.stl":stl(),"__MACOSX/._wedge.stl":APPLE_DOUBLE}));
  assert.equal(model.source.archiveEntry,"wedge.stl");
  assert.equal(model.components.length,1);
  assert.equal(model.components[0].geometry.indices.length,3);
  assert.equal(model.format,"F3Z");
});

test("a folder-wrapped archive with upper-case extension imports",async()=>{
  const model=await parse(await archive({"Munin/HULL.STL":stl().toUpperCase(),"__MACOSX/Munin/._HULL.STL":APPLE_DOUBLE}));
  assert.equal(model.source.archiveEntry,"Munin/HULL.STL");
});

test("every STL body in the archive is imported with unique ids",async()=>{
  const model=await parse(await archive({"bodies/hull.stl":stl(0),"bodies/deck.stl":stl(5),"bodies/keel.stl":stl(9),
    "__MACOSX/bodies/._hull.stl":APPLE_DOUBLE}));
  assert.equal(model.components.length,3);
  assert.deepEqual(model.components.map(c=>c.name),["deck.stl","hull.stl","keel.stl"]);
  assert.equal(new Set(model.components.map(c=>c.id)).size,3);
  assert.deepEqual(model.source.archiveEntries,["bodies/deck.stl","bodies/hull.stl","bodies/keel.stl"]);
  assert.equal(model.components[1].metadata.fusionArchiveEntry,"bodies/hull.stl");
  assert.equal(model.unit,"meter");
});

test("very many STL bodies are capped and the omission is reported",async()=>{
  const files={};
  for(let i=0;i<70;i++)files["b"+String(i).padStart(2,"0")+".stl"]=stl(i);
  const model=await parse(await archive(files));
  assert.equal(model.components.length,64);
  assert.equal(model.source.omittedBodies,6);
});

test("an unreadable 3MF falls back to the STL in the same archive",async()=>{
  const model=await parse(await archive({"broken.3mf":Uint8Array.from([1,2,3,4]),"hull.stl":stl()}));
  assert.equal(model.source.archiveEntry,"hull.stl");
});

test("when nothing is readable the error names the entry and the cause",async()=>{
  await assert.rejects(parse(await archive({"hull.stl":"solid x\nfacet normal 0 0 1\nouter loop\nvertex nan 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet"})),
    /Could not read hull\.stl: ASCII STL has a non-numeric/);
});

test("typed arrays, Node Buffers and sliced views are accepted as archive input",async()=>{
  const buffer=await archive({"hull.stl":stl()});
  assert.equal((await parse(new Uint8Array(buffer))).components.length,1);
  assert.equal((await parse(Buffer.from(buffer))).components.length,1);
  const padded=new Uint8Array(buffer.byteLength+9);padded.set(new Uint8Array(buffer),9);
  assert.equal((await parse(padded.subarray(9))).components.length,1);
});

test("bad archive input gets an accurate message instead of a size-limit error",async()=>{
  await assert.rejects(parse("not bytes"),/ArrayBuffer or a typed array/);
  await assert.rejects(parse(new ArrayBuffer(0)),/is empty/);
  await assert.rejects(parse(new TextEncoder().encode("plain text, no zip").buffer),
    error=>error.code==="APS_REQUIRED"&&/ZIP archive/.test(error.message));
});

test("an archive holding only junk or metadata reports that no geometry exists",async()=>{
  await assert.rejects(parse(await archive({"__MACOSX/._x.stl":APPLE_DOUBLE,"Previews/small.png":PNG})),
    error=>error.code==="APS_REQUIRED"&&error.inventory.stl===0);
});

test("a nested F3D design with a neutral STL is found one level down",async()=>{
  const inner=await archive({"hull.stl":stl(),"__MACOSX/._hull.stl":APPLE_DOUBLE});
  const model=await parse(await archive({"Design.f3d":new Uint8Array(inner)}));
  assert.equal(model.source.archiveEntry,"Design.f3d / hull.stl");
  assert.equal(model.source.nestedDesign,"Design.f3d");
});

test("CAD workspace inspector lists only real geometry and picks the real thumbnail",async()=>{
  const inner=await archive({"Previews/small.png":PNG,"__MACOSX/Previews/._small.png":APPLE_DOUBLE,"hull.stl":stl(),"__MACOSX/._hull.stl":APPLE_DOUBLE});
  const report=await inspectFusionPackage(new Uint8Array(await archive({"Design.f3d":new Uint8Array(inner),
    "__MACOSX/._Design.f3d":APPLE_DOUBLE,"Previews/large.png":PNG,".DS_Store":APPLE_DOUBLE})),"robot.f3z",{JSZip});
  assert.equal(report.designsTotal,1);
  assert.equal(report.entries,2);
  assert.equal(report.preview.path,"Previews/large.png");
  assert.deepEqual(report.documents[0].neutral,["hull.stl"]);
  assert.equal(report.documents[0].entries,2);
  assert.equal(report.documents[0].preview.path,"Previews/small.png");
});
