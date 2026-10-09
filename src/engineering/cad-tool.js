import {parseCADBuffer,isCADFile} from "../model/parsers/cad-runtime.js?v=32b251adf493102ba1bcd46f60f58333e902f3d4";
import {parseSTL} from "../model/parsers/stl.js?v=32b251adf493102ba1bcd46f60f58333e902f3d4";
import {parse3MF} from "../model/parsers/three-mf.js?v=32b251adf493102ba1bcd46f60f58333e902f3d4";
import {renderModelWorkbench} from "../viewers/model-workbench.js?v=32b251adf493102ba1bcd46f60f58333e902f3d4";
import {renderFusionPackage} from "../viewers/fusion-package-view.js?v=32b251adf493102ba1bcd46f60f58333e902f3d4";

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
 <p id="cad-import-status" role="status" aria-live="polite">Choose a file. Nothing is uploaded.</p>
 <section id="cad-geometry-stage" class="cad-geometry-stage" aria-label="CAD 3D workbench"></section>
 </main>`;
}
export function mountCADTool(root){
 const picker=root.querySelector("#cad-import-file"),stage=root.querySelector("#cad-geometry-stage");
 const cancel=root.querySelector("#cad-import-cancel"),status=root.querySelector("#cad-import-status");
 if(!picker||!stage)return ()=>{};
 let controller=null,cleanup=()=>{},request=0,disposed=false;
 function stop(){
   controller?.abort();controller=null;
   cleanup();cleanup=()=>{};
   cancel.disabled=true;
 }
 const onCancel=()=>{request++;stop();stage.replaceChildren();status.textContent="Import cancelled"};
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
     const rendered=await renderModelWorkbench(stage,documentModel);
     if(current!==request||disposed){rendered?.cleanup?.();return}
     cleanup=rendered?.cleanup||(()=>{});
   }catch(error){
     if(current!==request||disposed)return;
     status.textContent="CAD import failed: "+String(error?.message||error);
   }finally{if(current===request&&!disposed){cancel.disabled=true;controller=null}}
 };
 picker.addEventListener("change",onChange);
 return ()=>{disposed=true;request++;stop();picker.removeEventListener("change",onChange);cancel.removeEventListener("click",onCancel)};
}
