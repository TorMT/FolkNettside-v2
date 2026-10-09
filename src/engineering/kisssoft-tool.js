import {parseKisssoftBuffer} from "./kisssoft-core.js";
const esc=x=>String(x??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const mm=n=>Number.isFinite(n)?n.toFixed(2)+" mm":"unknown";
function gearShape(cx,cy,r,z,{internal=false,fill="#75b9e0",phase=0}={}){
 const teeth=Math.abs(z||0),n=Math.min(teeth,240);
 if(n<3)return "";
 const pts=[];
 for(let k=0;k<n;k++)for(let j=0;j<4;j++){
   const angle=2*Math.PI*(k+j/4)/n+phase;
   const radius=r*(internal?(j===1||j===2?0.972:1.012):(j===1||j===2?1.035:0.962));
   pts.push((cx+radius*Math.cos(angle)).toFixed(2)+","+(cy+radius*Math.sin(angle)).toFixed(2));
 }
 return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="#142936" stroke-width="0.7"/>`;
}
export function kisssoftDiagram(model,{rotation=0}={}){
 if(!model.planetary)return '<p>Parameter inspection only. Full geometry is unavailable for this KISSsoft module; export STL/3MF from KISSsoft for a precise 3D preview.</p>';
 const [sun,planet,ring]=model.gears.map(g=>Math.abs(g.teeth));
 const scale=190/ring,rs=sun*scale,rp=planet*scale,rr=ring*scale;
 const gap=(sun+planet)*scale;
 const phases=[0,2*Math.PI/3,4*Math.PI/3];
 const ringMarkup=`<circle cx="210" cy="210" r="${rr+9}" fill="#264055" stroke="#6c879b" stroke-width="3"/>`+
 gearShape(210,210,rr,ring,{internal:true,fill:"#a8bacb"})+
 `<circle cx="210" cy="210" r="${rr-12}" fill="#102d40"/>`;
 const planets=phases.map((a,i)=>{
   const x=210+gap*Math.cos(a),y=210+gap*Math.sin(a);
   return `<g>${gearShape(x,y,rp,planet,{fill:"#c6a164",phase:-rotation*.8+i*2*Math.PI/planet})}
    <circle cx="${x}" cy="${y}" r="9" fill="#1b3d55" stroke="#eff7fa" stroke-width="2"/></g>`;
 }).join("");
 const center=gearShape(210,210,rs,sun,{fill:"#6cc5bc",phase:rotation});
 return `<svg viewBox="0 0 420 420" role="img" aria-label="Conceptual planetary gearing: sun ${sun}, planet ${planet}, ring ${ring}. Not an exact KISSsoft tooth profile" style="width:min(100%,520px);height:auto;display:block;margin:auto;background:#102d40;border-radius:12px">
 ${ringMarkup}${planets}${center}
 <circle cx="210" cy="210" r="8" fill="#173448" stroke="#fff" stroke-width="2"/>
 </svg>`;
}
export function kisssoftSummary(model,rotation=0){
 const gearNames=["Sun","Planet","Internal ring"];
 const gearRows=model.gears.map((g,i)=>`<tr><td>${gearNames[i]}</td><td>${esc(g.teeth)}</td><td>${mm(g.width)}</td><td>${esc(g.material)}</td></tr>`).join("");
 const status=model.planetary?(model.consistent?"Tooth-count geometry consistent":"Tooth-count mismatch; verify source values"):"No validated planetary layout";
 return `<section class="kisssoft-summary"><h2>${esc(model.name)}</h2>
  <p><strong>${esc(model.moduleCode)}</strong> · KISSsoft ${esc(model.version)} · ${esc(status)}</p>
  <div class="kisssoft-layout"><div><div class="kisssoft-3d-slot" data-kisssoft-3d aria-label="Interactive concept model"></div>${kisssoftDiagram(model,{rotation})}<p class="muted">Concept sketch using pitch proportions and schematic teeth; not a manufacturable tooth profile or validated CAD model. Three planets are shown illustratively: planet count is not inferred from this file.</p></div>
  <div><h3>Imported parameters</h3><p>Normal module: ${mm(model.module)} · Helix angle: ${esc(model.beta)}°</p><p>Nominal sun–planet center distance: ${mm(model.centerDistance)}</p>
  <table><thead><tr><th>Gear</th><th>Teeth</th><th>Face width</th><th>Material</th></tr></thead><tbody>${gearRows}</tbody></table>
  <details><summary>All recognized parameter records (${Object.keys(model.fields).length})</summary><div style="max-height:250px;overflow:auto"><table>${Object.entries(model.fields).slice(0,3000).map(([key,value])=>`<tr><td>${esc(key)}</td><td>${esc(value)}</td></tr>`).join("")}</table></div></details></div></div></section>`;
}
export async function mountKisssoftVisual(target,model){
 if(!model.planetary||!model.consistent)return ()=>{};
 const stage=target.querySelector("[data-kisssoft-3d]");
 if(!stage)return ()=>{};
 stage.textContent="Loading interactive 3D concept…";
 try{
  const {mountKisssoft3D}=await import("./kisssoft-3d.js");
  if(!stage.isConnected)return ()=>{};
  const cleanup=await mountKisssoft3D(stage,model);
  return cleanup;
 }catch(error){
  if(stage.isConnected)stage.textContent="3D rendering unavailable. The 2D gear diagram remains available.";
  return ()=>{};
 }
}
export function kisssoftPageHTML(){
 return `<main class="section kisssoft-page"><p class="crumbs">Engineering / KISSsoft</p><h1>KISSsoft gear inspector</h1>
 <p>Open a local .Z14, .Z12, .W10 or .KSYS file. A validated Z014 planetary dataset supports conceptual gear visualization. Other formats show available parameter information only.</p>
 <label class="form-field">KISSsoft file <input id="kisssoft-file" type="file" accept=".z12,.z14,.w10,.ksys"></label>
 <div id="kisssoft-output" role="status" aria-live="polite"><p>No file loaded. Your file stays in your browser.</p></div></main>`;
}
export function mountKisssoft(root){
 const input=root.querySelector("#kisssoft-file"),output=root.querySelector("#kisssoft-output");
 if(!input||!output)return ()=>{};
 let dispose3D=()=>{};
 let generation=0;
 input.addEventListener("change",async()=>{
   const current=++generation;
   dispose3D();dispose3D=()=>{};
   const file=input.files?.[0];if(!file)return;
   output.textContent="Reading KISSsoft parameters…";
   try{
     if(file.size>12_000_000)throw Error("File exceeds 12 MB safe preview limit");
     const model=parseKisssoftBuffer(await file.arrayBuffer(),file.name);
     let rotation=0;
     const show=()=>{output.innerHTML=kisssoftSummary(model,rotation)+
       '<label>Concept rotation <input id="kisssoft-rotation" type="range" min="0" max="360" value="'+Math.round(rotation*180/Math.PI)+'"></label>';
       output.querySelector("#kisssoft-rotation").oninput=e=>{rotation=Number(e.target.value)*Math.PI/180;const visual=output.querySelector("svg");if(visual)visual.outerHTML=kisssoftDiagram(model,{rotation});};
     };
     show();
     const dispose=await mountKisssoftVisual(output,model);
     if(current!==generation){dispose();return}
     dispose3D=dispose;
   }catch(error){output.textContent="Unable to import file: "+String(error.message||error)}
 });
 return ()=>{generation++;dispose3D();};
}
