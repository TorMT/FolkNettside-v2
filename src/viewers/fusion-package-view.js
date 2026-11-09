import {inspectFusionPackage} from "../model/parsers/fusion-preview.js";
import {parseFusionArchive} from "../model/parsers/fusion-archive.js";
import {renderModelWorkbench} from "./model-workbench.js";
import {downloadFusionScriptPackage} from "../engineering/fusion-installer.js";

const esc=value=>String(value??"").replace(/[&<>"']/g,c=>
 ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const label=name=>String(name||"Untitled").split("/").pop();

/** Archive-level preview, never a fake representation of proprietary B-rep. */
export async function renderFusionPackage(container,buffer,name){
 const archive=await inspectFusionPackage(buffer,name);
 let disposed=false,modelCleanup=()=>{};
 const urls=[];
 const entries=archive.documents.length?archive.documents:
   [{path:archive.name,kind:archive.format,preview:archive.preview,neutral:archive.neutral,entries:archive.entries}];
 const hasGeometry=archive.neutral.length>0||entries.some(doc=>doc.neutral?.length);
 const neutralCount=archive.neutral.length+
   entries.reduce((sum,doc)=>sum+(doc.neutral?.length||0),0);
 const savedPreviewCount=entries.filter(doc=>doc.preview).length;
 container.innerHTML='<section class="fusion-inspector">'+
  '<header class="fusion-inspector-heading"><div><span class="project-kicker">Autodesk Fusion archive</span>'+
  '<h2>'+esc(archive.name)+'</h2><p>'+esc(archive.format)+' · '+archive.entries+' archive entries · '+
  archive.designsTotal+' embedded design(s)</p></div>'+
  (hasGeometry?'<button class="btn primary" type="button" data-fusion-model>Open available 3D geometry</button>':'')+
  '</header>'+
  '<section class="fusion-geometry-state" aria-label="3D import capability">'+
  '<strong>'+(hasGeometry?'Some real 3D geometry is available':'Native Fusion solids are not directly viewable')+'</strong>'+
  '<p>'+esc(archive.designsTotal)+' embedded Fusion designs · '+
    esc(savedPreviewCount)+' saved 2D previews · '+
    esc(neutralCount)+' neutral geometry file(s). '+
    (hasGeometry?
      'The 3D button opens the first supported embedded mesh or CAD file; this may be only part of the assembly.':
      'An F3Z contains native F3D designs. Saved pictures are not rotatable solids, and FolkNet cannot reconstruct their proprietary geometry on its own.')+
  '</p>'+
  '<p>For a complete interactive assembly, open the top-level design in Autodesk Fusion, run the FolkNetFusion export script and import its resulting Engineering ZIP here. The original F3Z stays unchanged.</p>'+
  '<button class="btn" type="button" data-fusion-export-script>Get Fusion export script (.zip)</button>'+
  '</section>'+
  '<div class="fusion-inspector-layout">'+
  '<aside class="fusion-design-list" aria-label="Archive designs">'+
  '<h3>Designs / documents</h3>'+
  entries.map((entry,i)=>'<button type="button" data-fusion-design="'+i+'" '+
   (i===0?'aria-pressed="true"':'aria-pressed="false"')+'>'+
   '<span>'+esc(label(entry.path))+'</span>'+
   '<small>'+esc(entry.preview?"Saved preview":entry.error?"Cannot inspect":"Archive document")+'</small>'+
   '</button>').join("")+
  '</aside>'+
  '<div class="fusion-design-content" data-fusion-content></div></div>'+
  '<div class="fusion-live-model" data-fusion-3d hidden></div>'+
  '<p role="status" aria-live="polite" data-fusion-status></p>'+
  '</section>';
 const $=sel=>container.querySelector(sel),slot=$("[data-fusion-content]"),
  status=$("[data-fusion-status]"),three=$("[data-fusion-3d]");
 function display(index){
   if(disposed)return;
   const chosen=entries[index];
   if(!chosen)return;
   container.querySelectorAll("[data-fusion-design]").forEach(button=>
     button.setAttribute("aria-pressed",String(Number(button.dataset.fusionDesign)===index)));
   slot.replaceChildren();
   const heading=document.createElement("h3");
   heading.textContent=label(chosen.path);slot.append(heading);
   if(chosen.preview){
     const preview=chosen.preview;
     const url=URL.createObjectURL(new Blob([preview.data],{type:preview.mime}));
     urls.push(url);
     const picture=document.createElement("img");
     picture.className="fusion-native-thumbnail";
     picture.alt="Original Fusion archive thumbnail (flat image, not interactive 3D geometry)";
     picture.src=url;picture.decoding="async";
     slot.append(picture);
     const caption=document.createElement("p");caption.className="muted";
     caption.textContent="Saved 2D preview · "+preview.path;
     slot.append(caption);
   }else{
     const notice=document.createElement("p");notice.className="muted";
     notice.textContent=chosen.error?
       "Embedded document cannot be inspected: "+chosen.error:
       "No saved preview found in this design. The original native CAD model is retained in the archive.";
     slot.append(notice);
   }
   const details=document.createElement("p");
   details.textContent=(chosen.entries||0)+" document entries"+
     (chosen.neutral?.length?" · "+chosen.neutral.length+" neutral geometry file(s)":"");
   slot.append(details);
   if(chosen.neutral?.length){
     const p=document.createElement("p");p.className="muted";
     p.textContent="Previewable geometry: "+chosen.neutral.slice(0,8).map(label).join(", ");
     slot.append(p);
   }
 }
 entries.forEach((entry,i)=>container.querySelector('[data-fusion-design="'+i+'"]')
   ?.addEventListener("click",()=>display(i)));
 display(0);
 const exportScript=$("[data-fusion-export-script]");
 exportScript?.addEventListener("click",async()=>{
   exportScript.disabled=true;
   status.textContent="Preparing local Fusion STEP export helper…";
   try{
     await downloadFusionScriptPackage();
     if(!disposed)status.textContent="Fusion script downloaded. Extract it, add FolkNetFusion in Fusion Scripts and Add-ins, run it on the open top-level assembly and import the generated Engineering ZIP.";
   }catch(error){
     if(!disposed)status.textContent="Script download failed: "+String(error?.message||error)+
       ". Open Engineering / CAD for the direct Python script link.";
   }finally{if(!disposed)exportScript.disabled=false}
 });
 const open3D=$("[data-fusion-model]");
 open3D?.addEventListener("click",async()=>{
   open3D.disabled=true;
   status.textContent="Reading real embedded neutral geometry locally…";
   try{
     const model=await parseFusionArchive(buffer.slice(0),name);
     if(disposed)return;
     modelCleanup();
     three.hidden=false;
     const rendered=await renderModelWorkbench(three,model);
     if(disposed){rendered?.cleanup?.();return}
     modelCleanup=rendered?.cleanup||(()=>{});
     status.textContent="Interactive 3D · "+model.components.filter(part=>part.geometry).length+
       " visible mesh component(s) from "+(model.source.archiveEntries?
         model.source.archiveEntries.length+" "+model.source.embeddedFormat+" bodies"+
         (model.source.omittedBodies?" (+"+model.source.omittedBodies+" not loaded)":""):
         model.source.archiveEntry+" ("+model.source.embeddedFormat+")")+
       ". This is the embedded neutral geometry, not necessarily the entire Fusion assembly.";
     three.scrollIntoView?.({block:"nearest"});
   }catch(error){
     if(disposed)return;
     three.hidden=true;
     status.textContent="Could not load 3D geometry: "+String(error?.message||error)+
       ". The archive and any original thumbnail remain available.";
   }finally{if(!disposed)open3D.disabled=false}
 });
 return {info:archive.format+" · "+archive.designsTotal+" nested design(s) · "+
   (hasGeometry?"neutral 3D available":"native archive/thumbnail only"),
   cleanup(){
     disposed=true;modelCleanup();
     for(const url of urls)URL.revokeObjectURL(url);
   }};
}
