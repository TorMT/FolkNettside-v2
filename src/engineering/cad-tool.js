import {parseCADBuffer,isCADFile} from "../model/parsers/cad-runtime.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {parseSTL} from "../model/parsers/stl.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {parse3MF} from "../model/parsers/three-mf.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {renderModelWorkbench} from "../viewers/model-workbench.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {renderFusionPackage} from "../viewers/fusion-package-view.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {parseFusionEngineeringBundle} from "../model/parsers/fusion-engineering-bundle.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {fusionEngineeringReportHTML} from "./fusion-engineering-report.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {downloadFusionScriptPackage} from "./fusion-installer.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {mountAutodeskHubBrowser} from "./fusion-hub-browser.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {createModelDocument} from "../model/model-document.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";
import {boxMesh} from "../hydro/fixtures.js?v=f1e6806035ce1585a66db8865b7cb6cb2adbeeb0";

export function cadToolHTML(){
 return `<main class="section engineering-cad-page">
 <p class="crumbs">Engineering / CAD</p><h1>CAD workbench</h1>
 <p class="muted">Inspect CAD geometry and source-reported engineering properties in one workspace.
 OpenCascade tessellates STEP/IGES/BREP into an interactive preview; measurements
 from those meshes are approximations and not engineering certification.</p>
 <section class="cad-fusion-quickstart" aria-labelledby="cad-fusion-heading">
   <header class="cad-fusion-quickstart-head"><div>
     <span class="project-kicker">Recommended · works with Fusion student licence</span>
     <h2 id="cad-fusion-heading">Fusion → FolkNet, locally</h2>
     <p>Export STEP geometry, mass, material volume, centre of mass and inertia
     from the model open in Fusion. <strong>No APS account or cloud upload required.</strong></p>
   </div><button class="btn primary" id="cad-fusion-install" type="button">Get Fusion export script (.zip)</button></header>
   <ol class="cad-fusion-steps">
     <li><strong>Install once</strong><span>Unzip the download, then in Fusion go to Utilities → Scripts and Add-ins → Add (+). Select the FolkNetFusion folder.</span></li>
     <li><strong>Export in Fusion</strong><span>Open your assembly and run FolkNetFusion. It writes a ZIP into Documents/FolkNet_Fusion_Exports.</span></li>
     <li><strong>Inspect here</strong><span>Drop that ZIP below. STEP geometry and Fusion physical properties appear together.</span></li>
   </ol>
   <p class="muted cad-fusion-script-fallback">Prefer manual setup?
     <a href="./scripts/fusion_export_folknet.py" download>Get Python script only</a> ·
     <a href="https://github.com/TorMT/FolkNettside-v2/blob/main/docs/FUSION_IMPORT.md" target="_blank" rel="noopener noreferrer">Import instructions</a>
   </p>
   <p data-cad-fusion-install-status role="status" aria-live="polite"></p>
 </section>
 <section class="cad-local-import" aria-labelledby="cad-import-heading">
  <header><div><h2 id="cad-import-heading">Open a model</h2>
    <p class="muted">Files are handled in your browser. A native .f3z/.f3d can be inspected,
    but proprietary solids require the Fusion export above for physical-property analysis.</p></div></header>
  <label for="cad-import-file" id="cad-drop-zone" class="cad-drop-zone">
    <strong>Drop an engineering ZIP or model file here</strong>
    <span>or choose from your device · ZIP, STEP, IGES, BREP, STL, 3MF, F3D, F3Z · up to 55 MiB</span>
  </label>
  <div class="cad-import-bar">
   <label>Model file <input id="cad-import-file" type="file"
     accept=".step,.stp,.iges,.igs,.brep,.stl,.3mf,.f3d,.f3z,.zip"></label>
   <label>BREP units (if no metadata)
    <select id="cad-brep-units"><option value="millimeter">mm</option><option value="meter">m</option><option value="inch">in</option><option value="centimeter">cm</option></select>
   </label>
   <button class="btn" id="cad-import-cancel" type="button" disabled>Cancel import</button>
  </div>
  <p id="cad-import-status" role="status" aria-live="polite">Choose a file or open the demonstration. No file is uploaded to our server.</p>
 </section>
 <section id="cad-geometry-stage" class="cad-geometry-stage" aria-label="CAD 3D workbench"></section>
 <details class="cad-hub-advanced">
   <summary>Optional: Autodesk Fusion Hub cloud browsing (APS)</summary>
   <p class="muted">For accounts with an Autodesk APS app and authorized Hub access.
     This is separate from local Fusion export and is not needed for CAD analysis.</p>
   <div id="cad-fusion-hub-browser" class="cad-hub-section"></div>
 </details>
 </main>`;
}
export function mountCADTool(root){
 const picker=root.querySelector("#cad-import-file"),stage=root.querySelector("#cad-geometry-stage");
 const cancel=root.querySelector("#cad-import-cancel"),status=root.querySelector("#cad-import-status");
 const dropZone=root.querySelector("#cad-drop-zone");
 const installer=root.querySelector("#cad-fusion-install");
 const installerStatus=root.querySelector("[data-cad-fusion-install-status]");
 if(!picker||!stage)return ()=>{};
 let controller=null,cleanup=()=>{},request=0,disposed=false;
 const hubDetails=root.querySelector(".cad-hub-advanced");
 let hubMounted=false,stopHubBrowser=()=>{};
 const maybeMountHub=()=>{
   // Optional APS browsing is intentionally lazy: no config/network lookup
   // when the CAD user only wants to import local files.
   if(!disposed&&hubDetails?.open&&!hubMounted){
     hubMounted=true;
     stopHubBrowser=mountAutodeskHubBrowser(root.querySelector("#cad-fusion-hub-browser"));
   }
 };
 hubDetails?.addEventListener("toggle",maybeMountHub);
 maybeMountHub();
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
 const loadFile=async file=>{
   request++;const current=request;
   stop();stage.replaceChildren();
   if(!file)return;
   const ext=file.name.split(".").pop().toLowerCase();
   controller=new AbortController();cancel.disabled=false;
   status.textContent="Reading "+file.name+" locally…";
   try{
     const fusion=ext==="f3d"||ext==="f3z"||ext==="zip";
     if(file.size>(fusion?55:25)*1024*1024)throw Error("File exceeds safe import size limit");
     const buffer=await file.arrayBuffer();
     if(current!==request||disposed)return;
     if(ext==="zip"){
       status.textContent="Reading Fusion Engineering ZIP: validating provenance and STEP geometry…";
       const documentModel=await parseFusionEngineeringBundle(buffer,file.name,{
         signal:controller.signal
       });
       if(current!==request||disposed)return;
       const report=document.createElement("div");
       report.innerHTML=fusionEngineeringReportHTML(documentModel.fusionEngineering);
       const viewer=document.createElement("div");
       stage.replaceChildren(report,viewer);
       const result=await renderModelWorkbench(viewer,documentModel);
       if(current!==request||disposed){result?.cleanup?.();return}
       cleanup=result?.cleanup||(()=>{});
       status.textContent="Fusion API properties loaded · "+
         documentModel.components.filter(c=>c.geometry).length+
         " visual STEP components. Verify model coordinates and hull eligibility.";
       return;
     }
     if(fusion){
       status.textContent="Inspecting Fusion archive and nested designs locally…";
       const preview=await renderFusionPackage(stage,buffer,file.name);
       if(current!==request||disposed){preview.cleanup?.();return}
       cleanup=preview.cleanup||(()=>{});
       status.textContent=preview.info+
         (preview.info.includes("native archive/thumbnail only")?
          " · To calculate mass/inertia and open actual STEP solids, run the Fusion export script above.":"");
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
 const onChange=()=>{
   const file=picker.files?.[0];
   picker.value=""; // Choosing the same file again must trigger a fresh import.
   if(file)void loadFile(file);
 };
 const onDrag=event=>{
   event.preventDefault();
   if(event.type==="dragover")dropZone?.classList.add("is-dragging");
   if(event.type==="dragleave")dropZone?.classList.remove("is-dragging");
   if(event.dataTransfer)event.dataTransfer.dropEffect="copy";
 };
 const onDrop=event=>{
   event.preventDefault();
   dropZone?.classList.remove("is-dragging");
   const file=event.dataTransfer?.files?.[0];
   if(file)void loadFile(file);
 };
 const onInstall=async()=>{
   if(!installer)return;
   installer.disabled=true;
   installerStatus.textContent="Preparing Fusion script package locally…";
   try{
     await downloadFusionScriptPackage();
     if(!disposed)installerStatus.textContent="Script downloaded. Unzip the FolkNetFusion folder, add it in Fusion and run it on your open assembly.";
   }catch(error){
     if(!disposed)installerStatus.textContent="Could not prepare the script: "+
       String(error?.message||error)+". Use the Python script link instead.";
   }finally{if(!disposed)installer.disabled=false}
 };
 showEmpty();
 picker.addEventListener("change",onChange);
 dropZone?.addEventListener("dragover",onDrag);
 dropZone?.addEventListener("dragleave",onDrag);
 dropZone?.addEventListener("drop",onDrop);
 installer?.addEventListener("click",onInstall);
 return ()=>{
   disposed=true;request++;stop();stopHubBrowser();
   hubDetails?.removeEventListener("toggle",maybeMountHub);
   picker.removeEventListener("change",onChange);
   cancel.removeEventListener("click",onCancel);
   dropZone?.removeEventListener("dragover",onDrag);
   dropZone?.removeEventListener("dragleave",onDrag);
   dropZone?.removeEventListener("drop",onDrop);
   installer?.removeEventListener("click",onInstall);
 };
}
