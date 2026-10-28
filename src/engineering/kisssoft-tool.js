import {parseKisssoftBuffer} from "./kisssoft-core.js?v=36f07c61157411137f4a79e6379500223e5fc1ce";
import {externalGearPair,checkPlanetaryPitch} from "./gear-pitch-checks.js?v=36f07c61157411137f4a79e6379500223e5fc1ce";
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
 if(!model.planetary){
   const pair=externalGearPair(model);
   if(!pair)return '<p>Parameter inspection only. Insufficient tooth/module data for a gear preview; export STL/3MF from KISSsoft for actual geometry.</p>';
   if(pair.internal){
     const scale=160/pair.b.pitchRadius;
     const cxRing=210,cy=180;
     const cxPinion=cxRing+pair.centerDistance*scale;
     const rRing=pair.b.pitchRadius*scale,rPinion=pair.a.pitchRadius*scale;
     return `<svg viewBox="0 0 420 360" role="img" aria-label="Conceptual internal ring and pinion gearing; both shafts turn in the same direction" style="width:min(100%,520px);height:auto;display:block;margin:auto;background:#102d40;border-radius:12px">
       <circle cx="${cxRing}" cy="${cy}" r="${rRing+9}" fill="#607e94"/>
       ${gearShape(cxRing,cy,rRing,pair.b.teeth,{internal:true,fill:"#a8bacb",phase:rotation*pair.velocityRatio})}
       <circle cx="${cxRing}" cy="${cy}" r="${rRing*.922}" fill="#102d40"/>
       ${gearShape(cxPinion,cy,rPinion,pair.a.teeth,{fill:"#6cc5bc",phase:rotation})}
       <circle cx="${cxPinion}" cy="${cy}" r="6" fill="#153245"/>
     </svg>`;
   }
   const total=pair.a.pitchRadius+pair.b.pitchRadius;
   const scale=180/Math.max(total,pair.a.pitchRadius*2,pair.b.pitchRadius*2);
   const cx1=210-pair.b.pitchRadius*scale,cx2=210+pair.a.pitchRadius*scale;
   return `<svg viewBox="0 0 420 360" role="img" aria-label="Approximate two external gears with ${pair.a.teeth} and ${pair.b.teeth} teeth" style="width:min(100%,520px);height:auto;display:block;margin:auto;background:#102d40;border-radius:12px">
    ${gearShape(cx1,180,pair.a.pitchRadius*scale,pair.a.teeth,{fill:"#6cc5bc",phase:rotation})}
    ${gearShape(cx2,180,pair.b.pitchRadius*scale,pair.b.teeth,{fill:"#c6a164",phase:rotation*pair.velocityRatio})}
    <circle cx="${cx1}" cy="180" r="6" fill="#153245"/><circle cx="${cx2}" cy="180" r="6" fill="#153245"/>
    </svg>`;
 }

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
export function filterKisssoftFields(fields,query="",limit=150){
 const q=String(query).trim().toLowerCase();
 const matches=Object.entries(fields).filter(([key,value])=>!q||key.toLowerCase().includes(q)||String(value).toLowerCase().includes(q));
 return {total:matches.length,shown:matches.slice(0,limit)};
}
function parameterRows(filtered){
 return filtered.shown.map(([key,value])=>`<tr><td>${esc(key)}</td><td>${esc(value)}</td></tr>`).join("");
}
export function bindKisssoftParameterSearch(container,model){
 const input=container.querySelector("[data-kisssoft-filter]");
 const count=container.querySelector("[data-kisssoft-count]");
 const body=container.querySelector("[data-kisssoft-records]");
 if(!input||!count||!body)return;
 input.addEventListener("input",()=>{
   const filtered=filterKisssoftFields(model.fields,input.value);
   body.innerHTML=parameterRows(filtered);
   count.textContent=`Showing ${filtered.shown.length} of ${filtered.total} matching records`;
 });
}
export function kisssoftSummary(model,rotation=0){
 const pair=externalGearPair(model);
 const check=model.planetary?checkPlanetaryPitch(model):null;
 const gearNames=model.planetary?["Sun","Planet","Internal ring"]:pair?.internal?(pair.pinionIndex===0?["Pinion","Internal ring"]:["Internal ring","Pinion"]):["Gear 1","Gear 2","Gear 3"];
 const gearRows=(pair?model.gears.slice(0,2):model.gears).map((g,i)=>`<tr><td>${gearNames[i]}</td><td>${esc(g.teeth)}</td><td>${mm(g.width)}</td><td>${esc(g.material)}</td></tr>`).join("");
 const status=model.planetary?(model.consistent?"Tooth-count geometry consistent":"Tooth-count mismatch; verify source values"):pair?(pair.internal?"Internal ring/pinion: nominal pitch geometry":"External gear pair: nominal pitch geometry"):"No validated gear geometry";
 return `<section class="kisssoft-summary"><h2>${esc(model.name)}</h2>
  <p><strong>${esc(model.moduleCode)}</strong> · KISSsoft ${esc(model.version)} · ${esc(status)}</p>
  <div class="kisssoft-layout"><div><div class="kisssoft-3d-slot" data-kisssoft-3d aria-label="Interactive concept model"></div>${kisssoftDiagram(model,{rotation})}<p class="muted">Concept sketch using pitch proportions and schematic teeth; not a manufacturable tooth profile or validated CAD model. ${model.planetary?"Three planets are shown illustratively: planet count is not inferred from this file.":"The two gear shafts are a conceptual visualization of source parameters; no actual bearing or housing geometry is inferred."}</p></div>
  <div><h3>Imported parameters</h3><p>Normal module: ${mm(model.module)} · Helix β: ${Number.isFinite(model.beta)?model.beta.toFixed(3)+"°":"unknown"} ${Number.isFinite(model.betaRad)?`(file ${model.betaRad.toFixed(6)} rad)`:""}</p>
  ${Number.isFinite(model.pressureAngleNormalDeg)?`<p>Normal pressure angle αₙ: ${model.pressureAngleNormalDeg.toFixed(3)}°</p>`:""}
  ${Number.isFinite(pair?.a?.pressureAngleTransverseDeg??check?.sun?.pressureAngleTransverseDeg)?`<p>Transverse pressure angle αₜ: ${(pair?.a?.pressureAngleTransverseDeg??check?.sun?.pressureAngleTransverseDeg).toFixed(3)}°
   · Reference base circle radius: ${mm(pair?.a?.baseRadius??check?.sun?.baseRadius)}</p>`:""}
  <p>Nominal center distance: ${mm(check?.sunPlanetCenterDistance??pair?.centerDistance??model.centerDistance)}</p>
  ${Number.isFinite(model.sourceCenterDistance)?`<p>KISSsoft reported center distance (ZP[0].a): ${mm(model.sourceCenterDistance)}
    ${Number.isFinite(check?.sunPlanetCenterDistance??pair?.centerDistance??model.centerDistance)?
    ` · Nominal minus reported: ${mm((check?.sunPlanetCenterDistance??pair?.centerDistance??model.centerDistance)-model.sourceCenterDistance)}`:""}
    <small class="muted">(profile shifts and working center distance may explain differences)</small></p>`:""}
  ${check?`<p>Planetary pitch closure: ${Math.abs(check.residual)<1e-7?"consistent":mm(check.residual)+" mismatch"}</p>`:""}
  ${pair?`<p>Mesh: ${pair.internal?"internal":"external"} · Nominal speed ratio ω₂/ω₁: ${pair.velocityRatio.toFixed(4)} · Pitch tangency residual: ${pair.tangencyResidual.toExponential(1)} mm</p>`:""}
  <table><thead><tr><th>Gear</th><th>Teeth</th><th>Face width</th><th>Material</th></tr></thead><tbody>${gearRows}</tbody></table>
  <details><summary>Search recognized parameters (${Object.keys(model.fields).length})</summary><input type="search" data-kisssoft-filter placeholder="Search by parameter name or value" aria-label="Search KISSsoft parameters"><p data-kisssoft-count>Showing up to 150 records</p><div style="max-height:280px;overflow:auto"><table><tbody data-kisssoft-records>${parameterRows(filterKisssoftFields(model.fields))}</tbody></table></div></details></div></div></section>`;
}
export async function mountKisssoftVisual(target,model){
 if(!(model.planetary&&model.consistent)&&!externalGearPair(model))return ()=>{};
 const stage=target.querySelector("[data-kisssoft-3d]");
 if(!stage)return ()=>{};
 stage.textContent="Loading interactive 3D concept…";
 try{
  let cleanup;
  if(model.planetary&&model.consistent){
    const {mountKisssoft3D}=await import("./kisssoft-3d.js?v=36f07c61157411137f4a79e6379500223e5fc1ce");
    if(!stage.isConnected)return ()=>{};
    cleanup=await mountKisssoft3D(stage,model);
  }else{
    const {mountKisssoftPair3D}=await import("./kisssoft-pair-3d.js?v=36f07c61157411137f4a79e6379500223e5fc1ce");
    if(!stage.isConnected)return ()=>{};
    cleanup=await mountKisssoftPair3D(stage,model);
  }
  return cleanup;
 }catch(error){
  if(stage.isConnected)stage.textContent="3D rendering unavailable. The 2D gear diagram remains available.";
  return ()=>{};
 }
}
export function kisssoftPageHTML(){
 return `<main class="section kisssoft-page"><p class="crumbs">Engineering / KISSsoft</p><h1>KISSsoft gear inspector</h1>
 <p>Open a local .Z14, .Z12, .Z012RS, .Z014RS, .W10 or .KSYS file. Z014 planetary datasets and compatible two-shaft external pairs support conceptual rotating 3D gears and approximate helix. Other formats show available parameter information.</p>
 <label class="form-field">KISSsoft file <input id="kisssoft-file" type="file" accept=".z12,.z14,.z012,.z014,.z012rs,.z014rs,.w10,.ksys"></label>
 <div class="kisssoft-example" aria-label="KISSsoft demonstration files">
  <div><button class="btn" type="button" data-kisssoft-example>Open planetary · Z014</button> <a href="./examples/kisssoft/PlanetaryExample.Z14" download="PlanetaryExample.Z14">Download Z14</a></div>
  <div><button class="btn" type="button" data-kisssoft-ring-example>Open internal ring + pinion · Z012RS</button> <a href="./examples/kisssoft/InternalRingAndPinion.Z012RS" download="InternalRingAndPinion.Z012RS">Download Z012RS</a></div>
  <div><button class="btn" type="button" data-kisssoft-external-example>Open external helical pair · Z012</button> <a href="./examples/kisssoft/HelicalExternalPair.Z12" download="HelicalExternalPair.Z12">Download Z12</a></div>
  <small>Three synthetic parameter files for testing the viewer, not manufacturer-generated KISSsoft calculations or certified designs. Original imported angles are displayed without modification.</small></div>
 <div id="kisssoft-output" role="status" aria-live="polite"><p>No file loaded. Your file stays in your browser.</p></div></main>`;
}
export function mountKisssoft(root){
 const input=root.querySelector("#kisssoft-file"),output=root.querySelector("#kisssoft-output");
 const example=root.querySelector("[data-kisssoft-example]");
 if(!input||!output)return ()=>{};
 let dispose3D=()=>{},generation=0,disposed=false;
 async function showModel(buffer,name,current){
   if(current!==generation||disposed)return;
   const model=parseKisssoftBuffer(buffer,name);
   let rotation=0;
   const show=()=>{
     output.innerHTML=kisssoftSummary(model,rotation)+
       '<label>Concept rotation <input id="kisssoft-rotation" type="range" min="0" max="360" value="'+Math.round(rotation*180/Math.PI)+'"></label>';
     output.querySelector("#kisssoft-rotation").oninput=e=>{
       rotation=Number(e.target.value)*Math.PI/180;
       const visual=output.querySelector("svg");
       if(visual)visual.outerHTML=kisssoftDiagram(model,{rotation});
     };
   };
   show();
   bindKisssoftParameterSearch(output,model);
   const dispose=await mountKisssoftVisual(output,model);
   if(current!==generation||disposed){dispose();return}
   dispose3D=dispose;
 }
 async function openBuffer(read,name){
   const current=++generation;
   dispose3D();dispose3D=()=>{};
   output.textContent="Reading KISSsoft parameters…";
   try{
     const buffer=await read();
     if(current!==generation||disposed)return;
     if(buffer.byteLength>12_000_000)throw Error("File exceeds 12 MB safe preview limit");
     await showModel(buffer,name,current);
   }catch(error){
     if(current===generation&&!disposed)output.textContent="Unable to import file: "+String(error?.message||error);
   }
 }
 const onFile=()=>{
   const file=input.files?.[0];
   if(file)void openBuffer(()=>file.arrayBuffer(),file.name);
 };
 const onExample=()=>{
   void openBuffer(async()=>{
     const response=await fetch(new URL("../../examples/kisssoft/PlanetaryExample.Z14",import.meta.url),{cache:"no-cache"});
     if(!response.ok)throw Error("Example unavailable (HTTP "+response.status+")");
     return response.arrayBuffer();
   },"PlanetaryExample.Z14");
 };
 const ringExample=root.querySelector("[data-kisssoft-ring-example]");
 const externalExample=root.querySelector("[data-kisssoft-external-example]");
 const openExample=(fileName)=>{
   void openBuffer(async()=>{
     const response=await fetch(new URL("../../examples/kisssoft/"+fileName,import.meta.url),{cache:"no-cache"});
     if(!response.ok)throw Error("Example unavailable (HTTP "+response.status+")");
     return response.arrayBuffer();
   },fileName);
 };
 const onRingExample=()=>openExample("InternalRingAndPinion.Z012RS");
 const onExternalExample=()=>openExample("HelicalExternalPair.Z12");
 input.addEventListener("change",onFile);
 example?.addEventListener("click",onExample);
 ringExample?.addEventListener("click",onRingExample);
 externalExample?.addEventListener("click",onExternalExample);
 return ()=>{
   disposed=true;generation++;dispose3D();
   input.removeEventListener("change",onFile);
   example?.removeEventListener("click",onExample);
   ringExample?.removeEventListener("click",onRingExample);
   externalExample?.removeEventListener("click",onExternalExample);
 };
}
