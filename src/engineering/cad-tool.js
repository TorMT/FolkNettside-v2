import {MUNIN_PARTS,annotateMunin} from "./munin-parts.js";
import {ASV_MODEL} from "./asv-model.js";
import {DIVE_PARTS,annotateDive} from "./dive-parts.js";
import {DPV_PARTS,annotateDpv} from "./dpv-parts.js";
import {loadModelDocument} from "../model/load-model.js";
import {parseCADBuffer,isCADFile} from "../model/parsers/cad-runtime.js";
import {parseGLB} from "../model/parsers/gltf.js";
import {parseSTL} from "../model/parsers/stl.js";
import {formatMeters,modelExtentMeters,unitPlausibilityAdvisory} from "../model/model-extent.js";
import {parse3MF} from "../model/parsers/three-mf.js";
import {renderModelWorkbench} from "../viewers/model-workbench.js";
import {renderFusionPackage} from "../viewers/fusion-package-view.js";
import {parseFusionEngineeringBundle} from "../model/parsers/fusion-engineering-bundle.js";
import {fusionEngineeringReportHTML} from "./fusion-engineering-report.js";
import {downloadFusionScriptPackage} from "./fusion-installer.js";
import {mountAutodeskHubBrowser} from "./fusion-hub-browser.js";
import {createModelDocument} from "../model/model-document.js";
import {boxMesh} from "../hydro/fixtures.js";

/** Verified public originals on the NTNU file server; never mirrored to GitHub. */
export const MUNIN_CAD_SOURCES=Object.freeze({
 f3z:"https://tormt.folk.ntnu.no/diverse/Njord/filer/MuninTing/NJ26_MUN_HULL_ASM_MASTER.f3z",
 step:"https://tormt.folk.ntnu.no/diverse/Njord/filer/MuninTing/NJ26_MUN_HULL_ASM_MASTER.step",
 drawing:"https://tormt.folk.ntnu.no/diverse/Njord/filer/MuninTing/NJ26_MUN_HULL_ASM_MASTER%20Drawing%20v1.pdf"
});
/** Full rev B3 assembly STEP (19 MB) on the owner's NTNU web space; step.php adds the CORS header for GitHub Pages. */
export const DIVE_STEP_URL="https://tormt.folk.ntnu.no/diverse/Dykkecomputer/step.php";
export const DIVE_STEP_DOWNLOAD="https://tormt.folk.ntnu.no/diverse/Dykkecomputer/dykkecomputer-revB3-sammenstilling.step";
export const DIVE_PREVIEW_URL=new URL("../../assets/models/dykkecomputer-revb3.glb",import.meta.url).href;
export const DPV_PREVIEW_URL=new URL("../../assets/models/dpv-reva2.glb",import.meta.url).href;
export const MUNIN_PREVIEW_URL=new URL("../../assets/models/munin-mobile-preview.glb",import.meta.url).href;
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
 <section class="cad-example-munin" aria-labelledby="cad-munin-heading">
  <span class="project-kicker">Eget CAD-prosjekt · Njord / Munin</span>
  <h2 id="cad-munin-heading">Munin – katamaran med thrusteroppsett</h2>
  <p>Originalmodell og tilhørende tegning ligger på NTNU og kopieres ikke til GitHub Pages.</p>
  <p class="muted">Åpne en lett 3D-forhåndsvisning av den ekte modellen. Den lastes først når du trykker på knappen. Delene er gruppert fra originalens assembly-navn. Fargene er illustrative; originalene ligger under.</p>
  <p>To skrog, fire T200-thrustere (to CW og to CCW), batteriboks og sensorer. Komponenttreet grupperer de 130 mesh-delene etter funksjon; enkelte strukturdeler har uavklart undergruppe.</p>
  <div class="cad-munin-actions">
   <button class="btn primary" data-cad-munin-preview type="button">Vis Munin i 3D</button>
   <a class="btn primary" href="${MUNIN_CAD_SOURCES.step}" target="_blank" rel="noopener noreferrer">Hent Munin STEP (ca. 37 MB) ↗</a>
   <a class="btn" href="${MUNIN_CAD_SOURCES.f3z}" target="_blank" rel="noopener noreferrer">Fusion-assembly (.f3z) ↗</a>
   <a class="btn" href="${MUNIN_CAD_SOURCES.drawing}" target="_blank" rel="noopener noreferrer">Monteringstegning (PDF) ↗</a>
   <button class="btn" data-cad-munin-choose type="button">Åpne nedlastet modell</button>
  </div>
  <p class="muted">Forhåndsvisningen bruker meter. Lengde ca. 1,024 m, bredde 0,886 m og høyde 0,807 m. Dette er tessellert visningsgeometri; bruk original CAD for nøyaktige beregninger.</p>
 </section>
 <section class="cad-example-munin" aria-labelledby="cad-dive-heading">
  <span class="project-kicker">Eget CAD-prosjekt · Dykkecomputer rev B3</span>
  <h2 id="cad-dive-heading">Dykkecomputer – hybridhus med all innmat</h2>
  <p>120 deler: aluminium topp og bunn, POM-midtring, linse, skjerm, kretskort med komponenter, batteri, spoler, O-ringer, skruer og innsatser.
  Bruk komponenttreet og «Explode» for å ta modellen fra hverandre gruppe for gruppe.</p>
  <div class="cad-asv-actions">
   <button class="btn primary" data-cad-dive-preview type="button">Vis dykkecomputeren i 3D</button>
   <button class="btn" data-cad-dive-step type="button">Åpne full STEP fra NTNU (19 MB)</button>
   <a class="btn" href="${DIVE_STEP_DOWNLOAD}" target="_blank" rel="noopener noreferrer">Hent STEP-sammenstilling ↗</a>
   <a class="btn" href="./assets/models/dykkecomputer-revb3.glb" download>Hent GLB (2 MB)</a>
   <a class="btn" href="./assets/demos/dykkecomputer/dykkecomputer-revb3.zip" download>Hent STEP-deler (120 filer, zip)</a>
   <a class="btn" href="#/projects/dykkecomputer">Om prosjektet</a>
  </div>
  <p class="muted">Visningsmodellen er tessellert og forenklet (ca. 110 000 trekanter) og bruker meter; mål og passform står i STEP-filene. Full STEP åpnes med OpenCascade i nettleseren og tar litt tid.</p>
 </section>
 <section class="cad-example-munin" aria-labelledby="cad-dpv-heading">
  <span class="project-kicker">Eget CAD-prosjekt · DPV rev A2 (startmodell)</span>
  <h2 id="cad-dpv-heading">DPV – undervannsscooter med innmat</h2>
  <p>32 deler med typiske mål: PVC-trykkrør 110×6,6, limt frontkappe, POM-plugg med O-ringer, batteri 6S2P (12 × 21700),
  BMS, ESC, ESP32, våt motor, propell i printet dyse, håndtak med magnettrigger og trimbly. Startmodell – mål erstattes når delene er veid og målt.</p>
  <div class="cad-asv-actions">
   <button class="btn primary" data-cad-dpv-preview type="button">Vis DPV-en i 3D</button>
   <a class="btn" href="./assets/models/dpv-reva2.glb" download>Hent GLB (0,6 MB)</a>
   <a class="btn" href="./assets/demos/dpv/dpv-reva2-step.zip" download>Hent STEP-deler (zip)</a>
   <a class="btn" href="./assets/demos/dpv/dpv-reva2-print-stl.zip" download>Printdeler (STL, zip)</a>
   <a class="btn" href="#/projects/dpv">Om prosjektet</a>
  </div>
  <p class="muted">Visningsmodellen bruker meter og er tessellert fra CadQuery-modellen. Prototype – ikke sertifisert dykkeutstyr.</p>
 </section>
 <section class="cad-example-munin" aria-labelledby="cad-asv-heading">
  <span class="project-kicker">ASV Tollak · forenklet visningsmodell</span>
  <h2 id="cad-asv-heading">ASV Tollak — skrog og propulsjon</h2>
  <p>Åpne direkte i CAD-viseren uten lokal import. GitHub inneholder foreløpig en
  <strong>forenklet modell</strong> basert på originalskrog og thrusterplasseringer;
  den opprinnelige Fusion STEP-assemblyen og den eksakte 3MF-skrogmeshen
  er ennå ikke publisert. Modellen er derfor ikke gyldig som hydrostatisk inndata.</p>
  <div class="cad-asv-actions">
    <button class="btn primary" data-cad-asv-preview type="button">Vis ASV Tollak i CAD 3D</button>
    <a class="btn" href="./examples/engineering/asv-hydro.html">GM, GZ og SAC (forutsetninger)</a>
    <a class="btn" href="./examples/models/asv-tollak-visual-preview.obj" download>Hent forenklet OBJ</a>
  </div>
  <p class="muted">Den separate Hydro-rapporten bruker det opplastede skroggrunnlaget
  med antakelser om PETG, tetthet og KG; kurvene er ikke beregnet fra forenklet OBJ.
  For faktiske skrogsnitt og kontroll, importer original 3MF i Hydro.</p>
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
   <label>File units (STL and BREP, if the file has none)
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
/** Status line after a mesh import: parts, unit, overall size and, when the
 * size is implausible for a vessel/part, a prompt to pick the right unit. */
export function importSummary(documentModel){
  const parts=documentModel.components.filter(c=>c.geometry).length;
  const extent=modelExtentMeters(documentModel);
  const size=extent?" · size "+extent.size.map(formatMeters).join(" × "):"";
  const advisory=unitPlausibilityAdvisory(extent,documentModel.unit);
  return "Imported "+parts+" mesh components · "+documentModel.unit+size+
    ". Move and inspect in the 3D view below."+(advisory?" Check units: "+advisory:"");
}
/** `open:"dykkecomputer"` or `open:"dpv"` loads that example straight away (route /engineering/cad/<name>). */
export function mountCADTool(root,{open=""}={}){
 const picker=root.querySelector("#cad-import-file"),stage=root.querySelector("#cad-geometry-stage");
 const cancel=root.querySelector("#cad-import-cancel"),status=root.querySelector("#cad-import-status");
 const dropZone=root.querySelector("#cad-drop-zone");
 const installer=root.querySelector("#cad-fusion-install");
 const muninChoose=root.querySelector("[data-cad-munin-choose]");
 const muninPreview=root.querySelector("[data-cad-munin-preview]");
 const asvPreview=root.querySelector("[data-cad-asv-preview]");
 const divePreview=root.querySelector("[data-cad-dive-preview]");
 const diveStep=root.querySelector("[data-cad-dive-step]");
 const dpvPreview=root.querySelector("[data-cad-dpv-preview]");
 const installerStatus=root.querySelector("[data-cad-fusion-install-status]");
 if(!picker||!stage)return ()=>{};
 let controller=null,cleanup=()=>{},request=0,disposed=false;
 let lastUnitlessFile=null; // STL/BREP carry no unit: re-read when the unit choice changes.
 const unitSelect=root.querySelector("#cad-brep-units");
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
   const rendered=await renderModelWorkbench(stage,documentModel,{mobileCompact:true});
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
   stage.classList.remove("is-fusion-archive","is-fusion-bundle");
   controller?.abort();controller=null;
   cleanup();cleanup=()=>{};
   cancel.disabled=true;
 }
 async function loadDive(){
   const current=++request;stop();stage.replaceChildren();
   controller=new AbortController();cancel.disabled=false;
   status.textContent="Laster dykkecomputeren…";
   stage.scrollIntoView({block:"start",behavior:"instant"});
   const activeController=controller;
   const timeout=setTimeout(()=>activeController.abort(),30000);
   try{
     const response=await fetch(DIVE_PREVIEW_URL,{signal:controller.signal});
     if(!response.ok)throw Error("HTTP "+response.status);
     const buffer=await response.arrayBuffer();
     if(current!==request||disposed)return;
     if(buffer.byteLength>15_000_000)throw Error("Modellen overskrider størrelsesgrensen");
     const model=await parseGLB(buffer,"Dykkecomputer rev B3",{coordinateSystem:"z-up",
       partMetadata:DIVE_PARTS,
       source:{url:"./assets/demos/dykkecomputer/dykkecomputer-revb3.zip",notes:"Tessellert fra STEP. Illustrative farger."}});
     if(current!==request||disposed)return;
     await presentModel(annotateDive(model),current);
     if(current===request&&!disposed)status.textContent="Dykkecomputer lastet · "+
       model.components.filter(c=>c.geometry).length+" deler · meter. Velg en gruppe i treet og dra «Explode» for å ta den fra hverandre.";
   }catch(error){
     if(current===request&&!disposed){
       status.textContent="Kunne ikke åpne dykkecomputeren: "+String(error?.message||error)+". STEP-filene kan lastes ned over.";
       showEmpty("Dykkecomputeren kunne ikke lastes. STEP-filene finnes over.");
     }
   }finally{clearTimeout(timeout);if(current===request&&!disposed){cancel.disabled=true;controller=null}}
 }
 async function loadDpv(){
   const current=++request;stop();stage.replaceChildren();
   controller=new AbortController();cancel.disabled=false;
   status.textContent="Laster DPV-en…";
   stage.scrollIntoView({block:"start",behavior:"instant"});
   const activeController=controller;
   const timeout=setTimeout(()=>activeController.abort(),30000);
   try{
     const response=await fetch(DPV_PREVIEW_URL,{signal:controller.signal});
     if(!response.ok)throw Error("HTTP "+response.status);
     const buffer=await response.arrayBuffer();
     if(current!==request||disposed)return;
     if(buffer.byteLength>15_000_000)throw Error("Modellen overskrider størrelsesgrensen");
     const model=await parseGLB(buffer,"DPV rev A2",{coordinateSystem:"z-up",
       partMetadata:DPV_PARTS,
       source:{url:"./assets/demos/dpv/dpv-reva2-step.zip",notes:"Startmodell med typiske mål. Illustrative farger."}});
     if(current!==request||disposed)return;
     await presentModel(annotateDpv(model),current);
     if(current===request&&!disposed)status.textContent="DPV lastet · "+
       model.components.filter(c=>c.geometry).length+" deler · meter. Velg en gruppe i treet og dra «Explode» for å ta den fra hverandre.";
   }catch(error){
     if(current===request&&!disposed){
       status.textContent="Kunne ikke åpne DPV-en: "+String(error?.message||error)+". STEP-filene kan lastes ned over.";
       showEmpty("DPV-en kunne ikke lastes. STEP-filene finnes over.");
     }
   }finally{clearTimeout(timeout);if(current===request&&!disposed){cancel.disabled=true;controller=null}}
 }
 async function loadDiveStep(){
   const current=++request;stop();stage.replaceChildren();
   controller=new AbortController();cancel.disabled=false;
   status.textContent="Henter full STEP fra NTNU (19 MB)…";
   stage.scrollIntoView({block:"start",behavior:"instant"});
   const activeController=controller;
   const timeout=setTimeout(()=>activeController.abort(),120000);
   try{
     const response=await fetch(DIVE_STEP_URL,{signal:controller.signal});
     if(!response.ok)throw Error("HTTP "+response.status);
     const buffer=await response.arrayBuffer();
     if(current!==request||disposed)return;
     status.textContent="Tesselerer STEP med OpenCascade…";
     const documentModel=await parseCADBuffer(buffer,"dykkecomputer-revB3-sammenstilling.step",{format:"step",signal:controller.signal});
     if(current!==request||disposed)return;
     await presentModel(documentModel,current);
     if(current===request&&!disposed)status.textContent="Full STEP lastet · "+importSummary(documentModel);
   }catch(error){
     if(current===request&&!disposed){
       status.textContent="Kunne ikke åpne full STEP fra NTNU: "+String(error?.message||error)+". Den lette 3D-visningen og nedlastingen virker fortsatt.";
       showEmpty("Full STEP kunne ikke lastes. Prøv «Vis dykkecomputeren i 3D».");
     }
   }finally{clearTimeout(timeout);if(current===request&&!disposed){cancel.disabled=true;controller=null}}
 }
 async function loadMunin(){
   const current=++request;stop();stage.replaceChildren();
   controller=new AbortController();cancel.disabled=false;
   status.textContent="Laster Munin-forhåndsvisning…";
   stage.scrollIntoView({block:"start",behavior:"instant"});
   const activeController=controller;
   const timeout=setTimeout(()=>activeController.abort(),30000);
   try{
     const response=await fetch(MUNIN_PREVIEW_URL,{signal:controller.signal});
     if(!response.ok)throw Error("HTTP "+response.status);
     const buffer=await response.arrayBuffer();
     if(current!==request||disposed)return;
     if(buffer.byteLength>15_000_000)throw Error("Modellen overskrider størrelsesgrensen");
     const model=await parseGLB(buffer,"Munin · Njord",{coordinateSystem:"z-up",
       partMetadata:MUNIN_PARTS,
       source:{url:MUNIN_CAD_SOURCES.step,notes:"Tessellert STEP. Illustrative farger og delnavn."}});
     if(current!==request||disposed)return;
     await presentModel(annotateMunin(model),current);
     if(current===request&&!disposed)status.textContent="Munin lastet · "+
       model.components.filter(c=>c.geometry).length+" deler · meter. Dra for å rotere, bruk Fit for å vise hele modellen.";
   }catch(error){
     if(current===request&&!disposed){
       status.textContent="Kunne ikke åpne Munin: "+String(error?.message||error)+". Prøv igjen eller bruk originaltegningen og lokal import.";
       showEmpty("Munin kunne ikke lastes. Originaltegning og STEP-lenke finnes over.");
     }
   }finally{clearTimeout(timeout);if(current===request&&!disposed){cancel.disabled=true;controller=null}}
 }
 async function loadASV(){
   const current=++request;stop();stage.replaceChildren();
   status.textContent="Laster kildebasert, forenklet ASV-visualisering…";
   stage.scrollIntoView({block:"start",behavior:"instant"});
   try{
     // The published Fusion engineering bundle is authoritative for the
     // entire assembly when present; the simplified visual is only fallback.
     let originalBundle=null;
     try{
       const response=await fetch(ASV_MODEL.originalAssemblyPath);
       if(response.ok)originalBundle=await response.arrayBuffer();
     }catch{ /* Binary original not uploaded yet. */ }
     if(current!==request||disposed)return;
     if(originalBundle){
       stage.classList.add("is-fusion-bundle");
       status.textContent="Importerer original Fusion STEP-assembly og masseegenskaper…";
       const doc=await parseFusionEngineeringBundle(
         originalBundle,"ASV Tollak – original Fusion assembly");
       if(current!==request||disposed)return;
       const report=document.createElement("div");
       report.className="cad-fusion-report";
       report.innerHTML=fusionEngineeringReportHTML(doc.fusionEngineering);
       const viewer=document.createElement("div");viewer.className="cad-fusion-model";
       stage.replaceChildren(report,viewer);
       const rendered=await renderModelWorkbench(viewer,doc,{mobileCompact:true});
       if(current!==request||disposed){rendered?.cleanup?.();return}
       cleanup=rendered?.cleanup||(()=>{});
       status.textContent="ASV Tollak · original Fusion STEP lastet · "+
         doc.components.filter(c=>c.geometry).length+
         " CAD-komponenter. CAD-masse reflekterer materialtilordningen i eksporten; bruk PETG-analysen for antatt plastmasse.";
       return;
     }
     const doc=await loadModelDocument(ASV_MODEL);
     if(current!==request||disposed)return;
     await presentModel(doc,current);
     if(current===request&&!disposed)status.textContent="ASV Tollak lastet · "+
       doc.components.filter(c=>c.geometry).length+
       (doc.originalGeometryLoaded
         ?" originale 3MF-komponenter · 3MF-skroget er åpent og ikke automatisk Hydro-validert."
         :" forenklede OBJ-komponenter · visning, ikke original CAD eller validert Hydro-geometri.");
   }catch(error){
     if(current===request&&!disposed){
       status.textContent="Kunne ikke åpne ASV-forhåndsvisning: "+String(error?.message||error);
       showEmpty("Kunne ikke åpne ASV. Hydro-rapport og nedlastbar forenklet OBJ ligger over.");
     }
   }
 }
 const onCancel=()=>{request++;stop();showEmpty();status.textContent="Import cancelled"};
 cancel.addEventListener("click",onCancel);
 const loadFile=async file=>{
   request++;const current=request;
   stop();stage.replaceChildren();
   if(!file)return;
   const ext=file.name.split(".").pop().toLowerCase();
   lastUnitlessFile=/^(stl|step|stp|iges|igs|brep)$/.test(ext)?file:null;
   controller=new AbortController();cancel.disabled=false;
   status.textContent="Reading "+file.name+" locally…";
   try{
     const fusion=ext==="f3d"||ext==="f3z"||ext==="zip";
     if(file.size>((fusion||isCADFile(file.name))?55:25)*1024*1024)throw Error("File exceeds safe import size limit");
     const buffer=await file.arrayBuffer();
     if(current!==request||disposed)return;
     if(ext==="zip"){
       stage.classList.add("is-fusion-bundle");
       status.textContent="Reading Fusion Engineering ZIP: validating provenance and STEP geometry…";
       const documentModel=await parseFusionEngineeringBundle(buffer,file.name,{
         signal:controller.signal
       });
       if(current!==request||disposed)return;
       const report=document.createElement("div");
       report.className="cad-fusion-report";
       report.innerHTML=fusionEngineeringReportHTML(documentModel.fusionEngineering);
       const viewer=document.createElement("div");
       viewer.className="cad-fusion-model";
       stage.replaceChildren(report,viewer);
       const result=await renderModelWorkbench(viewer,documentModel,{mobileCompact:true});
       if(current!==request||disposed){result?.cleanup?.();return}
       cleanup=result?.cleanup||(()=>{});
       status.textContent="Fusion API properties loaded · "+
         documentModel.components.filter(c=>c.geometry).length+
         " visual STEP components. Verify model coordinates and hull eligibility.";
       return;
     }
     if(fusion){
       stage.classList.add("is-fusion-archive");
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
     const fileUnit=unitSelect?.value||"millimeter";
     const documentModel= isCADFile(file.name)?
       await parseCADBuffer(buffer,file.name,{format:ext,signal:controller.signal,
         brepUnit:fileUnit}):
       ext==="stl"?parseSTL(buffer,file.name,{unit:fileUnit}):
       ext==="3mf"?await parse3MF(buffer,file.name):
       (()=>{throw Error("Unsupported file extension")})();
     if(current!==request||disposed)return;
     status.textContent=importSummary(documentModel);
     await presentModel(documentModel,current);
   }catch(error){
     if(current!==request||disposed)return;
     status.textContent="CAD import failed: "+String(error?.message||error);
     showEmpty("Import could not be displayed. Try the demo or check source units and format.");
   }finally{if(current===request&&!disposed){cancel.disabled=true;controller=null}}
 };
 const onUnitChange=()=>{if(lastUnitlessFile&&!disposed)void loadFile(lastUnitlessFile)};
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
 if(open==="dykkecomputer")void loadDive();
 if(open==="dpv")void loadDpv();
 const onMuninChoose=()=>picker.click();
 muninChoose?.addEventListener("click",onMuninChoose);
 muninPreview?.addEventListener("click",loadMunin);
 asvPreview?.addEventListener("click",loadASV);
 divePreview?.addEventListener("click",loadDive);
 diveStep?.addEventListener("click",loadDiveStep);
 dpvPreview?.addEventListener("click",loadDpv);
 picker.addEventListener("change",onChange);
 unitSelect?.addEventListener("change",onUnitChange);
 dropZone?.addEventListener("dragover",onDrag);
 dropZone?.addEventListener("dragleave",onDrag);
 dropZone?.addEventListener("drop",onDrop);
 installer?.addEventListener("click",onInstall);
 return ()=>{
   disposed=true;request++;stop();stopHubBrowser();
   hubDetails?.removeEventListener("toggle",maybeMountHub);
   picker.removeEventListener("change",onChange);
   unitSelect?.removeEventListener("change",onUnitChange);
   cancel.removeEventListener("click",onCancel);
   dropZone?.removeEventListener("dragover",onDrag);
   dropZone?.removeEventListener("dragleave",onDrag);
   dropZone?.removeEventListener("drop",onDrop);
   installer?.removeEventListener("click",onInstall);
   muninChoose?.removeEventListener("click",onMuninChoose);
   muninPreview?.removeEventListener("click",loadMunin);
  asvPreview?.removeEventListener("click",loadASV);
  divePreview?.removeEventListener("click",loadDive);
  diveStep?.removeEventListener("click",loadDiveStep);
  dpvPreview?.removeEventListener("click",loadDpv);
 };
}
