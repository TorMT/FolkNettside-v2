import {parseCADBuffer,isCADFile} from "../model/parsers/cad-runtime.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";
import {parseSTL} from "../model/parsers/stl.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";
import {parse3MF} from "../model/parsers/three-mf.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";
import {renderModelWorkbench} from "../viewers/model-workbench.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";
import {renderFusionPackage} from "../viewers/fusion-package-view.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";
import {createModelDocument} from "../model/model-document.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";
import {boxMesh} from "../hydro/fixtures.js?v=372fc0b23ecbcfb72b8ab7f0ecfb2a8de7627cd9";

export function cadToolHTML(){
 return `<main class="section engineering-cad-page">
 <p class="crumbs">Engineering / CAD</p><h1>CAD workbench</h1>
 <p>Open STEP/STP, IGES/IGS, BREP, STL, 3MF or native Fusion F3D/F3Z archives locally. OpenCascade converts
 exact CAD surfaces to a <strong>tessellated visual mesh</strong> in a browser worker;
 measurements and exports are therefore approximate, not a substitute for CAD inspection in your authoring tool.</p>
 <div class="cad-import-bar">
   <label>Model file <input id="cad-import-file" type="file"
     accept=".step,.stp,.iges,.igs,.brep,.stl,.3mf,.f3d,.f3z"></label>
   <label>BREP units (if no metadata)
    <select id="cad-brep-units"><option value="millimeter">mm</option><option value="meter">m</option><option value="inch">in</option><option value="centimeter">cm</option></select>
   </label>
   <button class="btn" id="cad-import-cancel" type="button" disabled>Cancel import</button>
 </div>
 <p id="cad-import-status" role="status" aria-live="polite">Choose a file or open the demonstration. Files remain local.</p>
 <section id="cad-geometry-stage" class="cad-geometry-stage" aria-label="CAD 3D workbench"></section>
 </main>`;
}
export function mountCADTool(root){
 const picker=root.querySelector("#cad-import-file"),stage=root.querySelector("#cad-geometry-stage");
 const cancel=root.querySelector("#cad-import-cancel"),status=root.querySelector("#cad-import-status");
 if(!picker||!stage)return ()=>{};
 let controller=null,cleanup=()=>{},request=0,disposed=false;
 function showEmpty(message="Inspect assemblies using orbit, pan, Fit and the component tree."){
   stage.replaceChildren();
   const box=document.createElement("div");
   box.className="cad-empty-state";
   box.innerHTML='<strong>3D CAD workspace</strong><p></p>'+
     '<button class="btn" type="button" data-cad-demo>Open demo assembly</button>'+
     '<small>Synthetic geometry, not a real CAD design.</small>';
   box.querySelector("p").textContent=message;
   stage.append(box);
   box.querySelector("[data-cad-demo]").addEventListener("click",()=>void loadDemo());
 }
 async function presentModel(documentModel,current){
   if(current!==request||disposed)return;
   const rendered=await renderModelWorkbench(stage,documentModel);
   if(current!==request||disposed){rendered?.cleanup?.();return}
   cleanup=rendered?.cleanup||(()=>{});
 }
 async function loadDemo(){
   const current=++request;stop();
   status.textContent="Opening synthetic two-part model…";
   const transform=[1,0,0,0,0,1,0,0,0,0,1,0,1.4,0,1.2,1];
   const demo=createModelDocument({name:"CAD demo",format:"demo",unit:"meter",components:[
     {id:"demo-main",name:"Main block",geometry:boxMesh({L:8,B:3,H:2})},
     {id:"demo-equipment",name:"Raised equipment",geometry:boxMesh({L:1.3,B:1,H:.5}),transform}
   ]});
   try{
     await presentModel(demo,current);
     if(current===request&&!disposed)
       status.textContent="Synthetic demo loaded · 2 components · 8 × 3 × 2 m main block. Try Fit, orbit and the component tree.";
   }catch(error){
     if(current===request&&!disposed){
       status.textContent="CAD demo failed: "+String(error?.message||error);
       showEmpty("WebGL failed to initialize. Enable browser hardware acceleration.");
     }
   }
 }
 function stop(){
   controller?.abort();controller=null;
   cleanup();cleanup=()=>{};
   cancel.disabled=true;
 }
 const onCancel=()=>{request++;stop();showEmpty();status.textContent="Import cancelled"};
 cancel.addEventListener("click",onCancel);
 const onChange=async()=>{
   request++;const current=request;
   stop();stage.replaceChildren();
   const file=picker.files?.[0];
   if(!file)return;
   const ext=file.name.split(".").pop().toLowerCase();
   controller=new AbortController();cancel.disabled=false;
   status.textContent="Reading "+file.name+" locally…";
   try{
     const fusion=ext==="f3d"||ext==="f3z";
     if(file.size>(fusion?55:25)*1024*1024)throw Error("File exceeds safe import size limit");
     const buffer=await file.arrayBuffer();
     if(current!==request||disposed)return;
     if(fusion){
       status.textContent="Inspecting Fusion archive and nested designs locally…";
       const preview=await renderFusionPackage(stage,buffer,file.name);
       if(current!==request||disposed){preview.cleanup?.();return}
       cleanup=preview.cleanup||(()=>{});
       status.textContent=preview.info;
       return;
     }
     status.textContent=isCADFile(file.name)?"Loading OpenCascade WASM for "+file.name+"…":"Reading mesh…";
     const documentModel= isCADFile(file.name)?
       await parseCADBuffer(buffer,file.name,{format:ext,signal:controller.signal,
         brepUnit:root.querySelector("#cad-brep-units")?.value||"millimeter"}):
       ext==="stl"?parseSTL(buffer,file.name):
       ext==="3mf"?await parse3MF(buffer,file.name):
       (()=>{throw Error("Unsupported file extension")})();
     if(current!==request||disposed)return;
     status.textContent="Imported "+documentModel.components.filter(c=>c.geometry).length+
       " mesh components · "+documentModel.unit+". Move and inspect in the 3D view below.";
     await presentModel(documentModel,current);
   }catch(error){
     if(current!==request||disposed)return;
     status.textContent="CAD import failed: "+String(error?.message||error);
     showEmpty("Import could not be displayed. Try the demo or check source units and format.");
   }finally{if(current===request&&!disposed){cancel.disabled=true;controller=null}}
 };
 showEmpty();
 picker.addEventListener("change",onChange);
 return ()=>{disposed=true;request++;stop();picker.removeEventListener("change",onChange);cancel.removeEventListener("click",onCancel)};
}
