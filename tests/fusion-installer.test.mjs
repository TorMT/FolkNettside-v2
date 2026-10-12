import test from "node:test";
import assert from "node:assert/strict";
import {buildFusionScriptPackage,downloadFusionScriptPackage,
 validateFusionScriptSource,FUSION_MANIFEST,FUSION_SCRIPT_FOLDER}
 from "../src/engineering/fusion-installer.js";

const script="# Run INSIDE Autodesk Fusion\nimport adsk.fusion\n"+
 "def run(context):\n    pass\n"+"# folknet-fusion.json\n"+"#".repeat(250);
class FakeZip{
 constructor(){this.entries=new Map()}
 file(path,content){this.entries.set(path,content)}
 async generateAsync(options){
  assert.equal(options.type,"blob");
  assert.equal(options.compression,"DEFLATE");
  return new Blob([JSON.stringify([...this.entries])],{type:"application/zip"});
 }
}
test("installable Fusion folder has matching Python script and manifest",async()=>{
 const packageBlob=await buildFusionScriptPackage(script,{Zip:FakeZip});
 const paths=new Map(JSON.parse(await packageBlob.text()));
 assert.equal(paths.get(FUSION_SCRIPT_FOLDER+"/FolkNetFusion.py"),script);
 const manifest=JSON.parse(paths.get("FolkNetFusion/FolkNetFusion.manifest"));
 assert.deepEqual(manifest,FUSION_MANIFEST);
 assert.equal(manifest.runOnStartup,false);
 assert.match(paths.get("README.txt"),/no APS required/);
});
test("reject missing or wrong downloaded script without packaging",async()=>{
 for(const sample of ["",null,"import adsk.fusion","x".repeat(300_000)]){
  assert.throws(()=>validateFusionScriptSource(sample));
  await assert.rejects(buildFusionScriptPackage(sample,{Zip:FakeZip}));
 }
});
test("user action downloads only from site's own pinned script, revoking blob URL",async()=>{
 const log=[];
 const anchor={click(){log.push(["click",this.download])},remove(){log.push(["remove"])}};
 const documentImpl={baseURI:"https://tormt.github.io/FolkNettside-v2/",
  body:{append(v){assert.equal(v,anchor);log.push(["append"])}},
  createElement(tag){assert.equal(tag,"a");return anchor}};
 const URLImpl={createObjectURL(blob){assert.ok(blob.size>300);return "blob:local-fusion"},
  revokeObjectURL(url){log.push(["revoke",url])}};
 const fetchImpl=async(url,opts)=>{
  log.push(["fetch",url]);
  assert.equal(opts.redirect,"error");
  return {ok:true,text:async()=>script};
 };
 const name=await downloadFusionScriptPackage({fetchImpl,Zip:FakeZip,documentImpl,URLImpl});
 assert.equal(name,"FolkNetFusion-script.zip");
 assert.deepEqual(log,[
  ["fetch","https://tormt.github.io/FolkNettside-v2/scripts/fusion_export_folknet.py"],
  ["append"],["click","FolkNetFusion-script.zip"],["remove"],
  ["revoke","blob:local-fusion"]
 ]);
 for(const sourceURL of ["https://evil.example/scripts/fusion_export_folknet.py",
   "./scripts/other.py","./scripts/fusion_export_folknet.py?token=x"]){
  await assert.rejects(downloadFusionScriptPackage({
   sourceURL,fetchImpl,Zip:FakeZip,documentImpl,URLImpl}),/Unexpected/);
 }
});
