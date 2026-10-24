// Isolate third-party OpenCascade WASM from the UI thread. No CAD contents
// are sent to the CDN: only the OpenCascade JavaScript and WASM are fetched.
const BASE="https://cdn.jsdelivr.net/npm/@sunbox/occt-import-js@0.0.29/dist/";
let runtime;
async function getOCCT(){
 if(!runtime)runtime=(async()=>{
   const [{default:factory},response]=await Promise.all([
     import(BASE+"occt-import-js.js"),
     fetch(BASE+"occt-import-js.wasm")
   ]);
   if(!response.ok)throw Error("OpenCascade WASM download failed (HTTP "+response.status+")");
   return factory({wasmBinary:await response.arrayBuffer()});
 })().catch(error=>{runtime=null;throw error});
 return runtime;
}
self.onmessage=async({data})=>{
 const {id,format,buffer}=data||{};
 try{
   if(!["step","iges","brep"].includes(format))throw Error("Unsupported CAD format");
   if(!(buffer instanceof ArrayBuffer)||!buffer.byteLength||buffer.byteLength>55*1024*1024)
     throw Error("CAD file must be between 1 byte and 55 MiB");
   const occt=await getOCCT();
   const args=new Uint8Array(buffer);
   const params={linearUnit:"millimeter",linearDeflectionType:"bounding_box_ratio",
      linearDeflection:0.002,angularDeflection:0.3};
   const result= format==="step"?occt.ReadStepFile(args,params):
     format==="iges"?occt.ReadIgesFile(args,params):
     occt.ReadBrepFile(args,params);
   if(!result?.success)throw Error("OpenCascade did not recognize CAD geometry");
   self.postMessage({id,success:true,result});
 }catch(error){
   self.postMessage({id,success:false,error:String(error?.message||error)});
 }
};
