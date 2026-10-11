import {normaliseWaveCase,waveObservationsCSV} from "./wave-core.js?v=8e0c15571814ec770413057e733c1fddcf4e4d02";
import {parseMotionRAOCSV} from "./motion-rao.js?v=8e0c15571814ec770413057e733c1fddcf4e4d02";
import {legacyAddedWaveResistance,legacyMorisonWaveForce} from "./wave-concept-estimates.js?v=8e0c15571814ec770413057e733c1fddcf4e4d02";
import {appendWaveRecord,importWaveCSV,readWaveCollection,
  sampleWaveRecord,writeWaveCollection,importWaveCollectionJSON} from "./wave-collection.js?v=8e0c15571814ec770413057e733c1fddcf4e4d02";

export function waveTraceSVG(points){
  if(!Array.isArray(points)||!points.length)return "<span>No observations</span>";
  const end=points.length-1,subset=points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/700))===0||i===end);
  const minT=points[0].timeS,maxT=points[end].timeS,spanT=Math.max(1e-9,maxT-minT);
  let lower=Infinity,upper=-Infinity;
  for(const p of points){lower=Math.min(lower,p.elevationM);upper=Math.max(upper,p.elevationM)}
  const spanY=Math.max(1e-9,upper-lower),coords=subset.map(p=>
    (12+(p.timeS-minT)/spanT*316).toFixed(2)+","+
    (104-(p.elevationM-lower)/spanY*88).toFixed(2)).join(" ");
  return `<svg class="wave-trace" viewBox="0 0 340 118" role="img" aria-label="Water surface elevation time history, ${points.length} samples">
    <rect x="8" y="8" width="324" height="100" rx="5" fill="none" stroke="currentColor" opacity=".2"/>
    <polyline fill="none" stroke="#19b1d9" stroke-width="2" stroke-linejoin="round" points="${coords}"/>
    <text x="12" y="115" font-size="10" fill="currentColor">${minT.toFixed(1)} s</text>
    <text x="276" y="115" font-size="10" fill="currentColor">${maxT.toFixed(1)} s</text>
  </svg>`;
}
function downloadText(text,name,mime){
  const url=URL.createObjectURL(new Blob([text],{type:mime}));
  const anchor=document.createElement("a");anchor.href=url;anchor.download=name;
  anchor.click();setTimeout(()=>URL.revokeObjectURL(url),8000);
}
export function mountWaveControls(host,scene,{open=false}={}){
  let records=readWaveCollection(),disposed=false,animate=true,active=false,raoTable=null;
  const root=document.createElement("details");
  root.className="model-wave-controls";root.open=open;
  root.innerHTML=`<summary>Waves &amp; time-series library <span>visual / exploratory</span></summary>
    <div class="model-wave-fields">
      <label>Wave height H (m)<input data-wave-height type="number" min="0" max="100" step=".1" value="1"></label>
      <label>Period T (s)<input data-wave-period type="number" min=".01" step=".1" value="6"></label>
      <label>Propagation heading (°)<input data-wave-heading type="number" step="5" value="0"></label>
      <label>Water depth (m)<input data-wave-depth type="number" min=".01" step="1" placeholder="Deep water"></label>
      <label>Probe X (m)<input data-wave-x type="number" step=".5" value="0"></label>
      <label>Probe Y (m)<input data-wave-y type="number" step=".5" value="0"></label>
    </div>
    <div class="model-wave-actions wave-heading-presets" aria-label="Wave approach presets">
      <button type="button" data-wave-heading-preset="180">Head seas</button>
      <button type="button" data-wave-heading-preset="0">Following seas</button>
      <button type="button" data-wave-heading-preset="90">Port beam</button>
      <button type="button" data-wave-heading-preset="270">Starboard beam</button>
    </div>
    <div class="model-wave-actions">
      <button type="button" data-wave-show>Show waves in 3D</button>
      <button type="button" data-wave-play>Pause</button>
      <label class="wave-motion-select">Model movement
        <select data-wave-motion aria-label="Wave model movement">
          <option value="anchored" selected>Anchored — model stays still</option>
          <option value="follow">Follow waves — illustrative heave</option>
          <option value="follow-slope">Surface tilt — illustrative heave, roll &amp; pitch</option>
          <option value="rao" disabled>Imported RAO — linear 6-DOF (requires file)</option>
        </select>
      </label>
      <button type="button" data-wave-capture>Collect probe series</button>
      <label class="wave-phase-scrub">Wave phase <input data-wave-phase type="range" min="0" max="360" step="5" value="0" aria-label="Wave animation phase in degrees">
        <output data-wave-phase-value>0°</output>
      </label>
    </div>
    <div class="model-wave-rao" data-wave-rao-panel>
      <div class="model-wave-actions">
        <strong>Motion RAO · import from seakeeping solver</strong>
        <label class="model-wave-import">Import 6-DOF RAO CSV
          <input data-wave-rao-import type="file" accept=".csv,.txt" hidden>
        </label>
        <a data-wave-rao-example href="${new URL("../../examples/rao/synthetic_six_dof_rao.csv",import.meta.url).href}" download="synthetic_six_dof_rao.csv">Download synthetic example</a>
        <button type="button" data-wave-rao-remove disabled>Unload RAO</button>
      </div>
      <p data-wave-rao-status role="status">No RAO loaded. Strict CSV columns:
        <code>heading_deg,omega_rad_s,dof,amplitude,phase_deg</code>.
        One row per surge, sway, heave, roll, pitch and yaw at each heading and frequency.
        Translations in m/m, rotations in rad/m incident wave <strong>amplitude</strong>.
        Phase leads positive, using exp(−iωt). Headings are wave propagation.
        Reference point must match the vessel's geometric centre in the preview.
      </p>
      <p class="model-wave-note">Only supplied headings are usable. Frequency is interpolated in complex RAO coordinates, never extrapolated. Imported files stay local to this tab; the synthetic example is not measured or validated response data.</p>
    </div>
    <p class="model-wave-status" role="status">Linear regular-wave preview. Hydro remains a still-water calculation.</p>
    <div class="model-wave-library">
      <div class="model-wave-library-head"><strong>Wave collection</strong>
        <label class="model-wave-import">Import CSV<input data-wave-import type="file" accept=".csv,.tsv,.txt" hidden></label>
        <label class="model-wave-import">Import library JSON<input data-wave-json type="file" accept=".json" hidden></label>
        <button type="button" data-wave-export>Export JSON</button>
      </div>
      <div class="model-wave-entries"></div>
    </div>
    <details class="model-wave-estimates">
      <summary>Legacy HydroLab concept loads · requires vessel inputs</summary>
      <div class="model-wave-fields">
        <label>Waterline length (m)<input data-wave-lwl type="number" min="0.01" step=".1" placeholder="Required"></label>
        <label>Waterline beam (m)<input data-wave-bwl type="number" min="0.01" step=".1" placeholder="Required"></label>
        <label>Vessel speed (m/s)<input data-wave-speed type="number" min="0" step=".1" placeholder="Required"></label>
        <label>Projected area (m²)<input data-wave-area type="number" min="0.01" step=".1" placeholder="Required"></label>
        <label>Displaced volume (m³)<input data-wave-volume type="number" min="0.01" step=".1" placeholder="Required"></label>
      </div>
      <button type="button" data-wave-estimate>Calculate concept estimates</button>
      <pre data-wave-estimate-output role="status">No wave loads calculated.</pre>
    </details>
    <p class="model-wave-note">Wave heading is the direction of propagation (+X is following seas); Head seas = 180°, port beam = 90° and starboard beam = 270°. The labels refer to a vessel with forward along +X and port along +Y.</p>
    <p class="model-wave-note">Movement is relative to the model's geometric centre. Follow adds illustrative heave; Surface tilt aligns with the local wave tangent (limited to ±12°). Neither is a vessel response calculation. Imported RAO mode instead animates the 6-DOF complex linear response supplied by an external solver, with no artificial scaling or damping. RAO accuracy and phase conventions depend entirely on the imported data, its reference point, and its heading/frequency coverage. Hydro remains still-water.</p>
    <p class="model-wave-note">Synthetic series are explicitly labeled. CSV columns: time_s,eta_m. Imported measurements do not automatically become spatial waves or validated wave loads. Records stay in this browser until exported or cleared.</p>`;
  host.append(root);
  const $=query=>root.querySelector(query);
  const status=$(".model-wave-status");
  const val=key=>Number(root.querySelector("[data-wave-"+key+"]")?.value);
  const options=()=>{
    const depth=$("[data-wave-depth]").value.trim();
    return normaliseWaveCase({
      heightM:val("height"),periodS:val("period"),headingDeg:val("heading"),
      waterDepthM:depth?Number(depth):Infinity
    });
  };
  function persist(){try{writeWaveCollection(records)}catch(e){status.textContent=e.message}}
  function renderRecords(){
    const listing=$(".model-wave-entries");listing.replaceChildren();
    if(!records.length){listing.textContent="No observations collected yet.";return}
    for(const entry of records.slice().reverse()){
      const article=document.createElement("article");
      article.className="model-wave-entry";
      const title=document.createElement("strong");title.textContent=entry.name;
      const note=document.createElement("span");
      note.textContent=(entry.source==="imported"?"Imported CSV":"Synthetic linear wave")+
        " · "+entry.points.length+" samples";
      article.append(title,note);
      const graph=document.createElement("div");graph.innerHTML=waveTraceSVG(entry.points);article.append(graph);
      const actions=document.createElement("div");actions.className="model-wave-actions";
      const csv=document.createElement("button");csv.textContent="CSV";csv.type="button";
      csv.addEventListener("click",()=>downloadText(waveObservationsCSV(entry.points),
        entry.id+".csv","text/csv;charset=utf-8"));
      const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";
      remove.addEventListener("click",()=>{records=records.filter(x=>x.id!==entry.id);persist();renderRecords()});
      if(entry.source==="synthetic"&&entry.wave){
        const show=document.createElement("button");show.type="button";
        show.textContent="Show this wave in 3D";
        show.addEventListener("click",()=>{
          try{
            const wave=normaliseWaveCase({
              ...entry.wave,
              waterDepthM:entry.wave.waterDepthM==null?Infinity:entry.wave.waterDepthM
            });
            active=true;
            $("[data-wave-height]").value=String(wave.heightM);
            $("[data-wave-period]").value=String(wave.periodS);
            $("[data-wave-heading]").value=String(wave.headingDeg);
            $("[data-wave-depth]").value=Number.isFinite(wave.waterDepthM)?
              String(wave.waterDepthM):"";
            $("[data-wave-show]").textContent="Hide waves";
            updateWave();
          }catch(error){status.textContent=String(error?.message||error)}
        });
        actions.prepend(show);
      }
      actions.append(csv,remove);article.append(actions);listing.append(article);
    }
  }
  const phaseInput=$("[data-wave-phase]");
  const phaseValue=$("[data-wave-phase-value]");
  const phaseTime=wave=>wave.periodS*Number(phaseInput.value)/360;
  function updateWave(){
    try{
      const wave=options();
      const motionMode=$("[data-wave-motion]").value;
      const result=scene.actions.setWave({enabled:active,...wave,animate,motionMode,
        timeS:phaseTime(wave),raoTable});
      const motionLabel=motionMode==="anchored"?"stationary vessel":
        motionMode==="follow"?"illustrative vertical following":
        motionMode==="follow-slope"?"illustrative heave + wave slope (tilt capped at 12°)":
        "imported linear 6-DOF RAO ("+result?.raoSource+"), not a numerical solver";
      status.textContent=active?`Airy wave: λ=${wave.wavelengthM.toFixed(2)} m, c=${wave.phaseSpeedMs.toFixed(2)} m/s · ${motionLabel}.`:
        "Wave surface hidden; still-water hydro and contour are unchanged.";
    }catch(error){
      active=false;scene.actions.setWave({enabled:false});
      $("[data-wave-show]").textContent="Show waves in 3D";
      status.textContent="No wave motion: "+String(error?.message||error);
    }
  }
  const raoStatus=$("[data-wave-rao-status]");
  const raoModeOption=$('[data-wave-motion] option[value="rao"]');
  const raoRemove=$("[data-wave-rao-remove]");
  $("[data-wave-rao-import]").addEventListener("change",async event=>{
    const file=event.target.files?.[0];
    if(!file)return;
    try{
      if(file.size>1600000)throw Error("RAO file is larger than the 1.6 MB limit");
      const parsed=parseMotionRAOCSV(await file.text(),{name:file.name});
      if(disposed)return;
      raoTable=parsed;raoModeOption.disabled=false;raoRemove.disabled=false;
      // Keep the user's selected wave period and heading when the imported
      // RAO covers them. Sort order of the RAO table must not silently change
      // the current sea from T=6 s to T=10 s.
      const requestedHeading=((val("heading")%360)+360)%360;
      const heading=parsed.headings.includes(requestedHeading)?
        requestedHeading:parsed.headings[0];
      const frequencies=parsed.rows.filter(r=>r.headingDeg===heading)
        .map(r=>r.omegaRadS);
      const requestedOmega=2*Math.PI/val("period");
      const nearestOmega=Math.min(Math.max(requestedOmega,
        Math.min(...frequencies)),Math.max(...frequencies));
      $("[data-wave-heading]").value=String(heading);
      $("[data-wave-period]").value=String(2*Math.PI/nearestOmega);
      $("[data-wave-motion]").value="rao";
      raoStatus.textContent="Loaded "+file.name+" · "+parsed.rows.length+
        " complete six-DOF frequency/heading samples · propagation headings "+
        parsed.headings.join(", ")+"°. Extrapolation disabled; solver provenance must be verified.";
      active=true;$("[data-wave-show]").textContent="Hide waves";
      updateWave();
    }catch(error){
      if(!disposed)raoStatus.textContent="RAO import rejected: "+String(error?.message||error);
    }
    event.target.value="";
  });
  raoRemove.addEventListener("click",()=>{
    raoTable=null;raoModeOption.disabled=true;raoRemove.disabled=true;
    if($("[data-wave-motion]").value==="rao"){
      $("[data-wave-motion]").value="anchored";active=false;
      $("[data-wave-show]").textContent="Show waves in 3D";
      updateWave();
    }
    raoStatus.textContent="RAO unloaded. Import a solver export or use the synthetic teaching sample.";
  });
  $("[data-wave-show]").addEventListener("click",event=>{
    active=!active;event.currentTarget.textContent=active?"Hide waves":"Show waves in 3D";updateWave();
  });
  // Selecting a motion or sea direction should be immediately visible even
  // when the water surface was previously hidden.
  const showWave=()=>{
    if(!active){
      active=true;
      $("[data-wave-show]").textContent="Hide waves";
    }
    updateWave();
  };
  $("[data-wave-motion]").addEventListener("change",showWave);
  for(const preset of root.querySelectorAll("[data-wave-heading-preset]")){
    preset.addEventListener("click",()=>{
      $("[data-wave-heading]").value=preset.dataset.waveHeadingPreset;
      showWave();
    });
  }
  $("[data-wave-play]").addEventListener("click",event=>{
    if(animate&&active){
      const state=scene.actions.getWaveMotionPose?.();
      const T=options().periodS;
      if(state&&Number.isFinite(state.timeS))
        phaseInput.value=String(Math.round((state.timeS%T)/T*360));
    }
    animate=!animate;event.currentTarget.textContent=animate?"Pause":"Play";
    phaseValue.textContent=phaseInput.value+"°";
    updateWave();
  });
  phaseInput.addEventListener("input",()=>{
    if(animate){
      animate=false;
      $("[data-wave-play]").textContent="Play";
    }
    phaseValue.textContent=phaseInput.value+"°";
    showWave();
  });
  $("[data-wave-capture]").addEventListener("click",()=>{
    try{
      const record=sampleWaveRecord(options(),{x:val("x"),y:val("y")});
      records=appendWaveRecord(records,record);persist();renderRecords();
      status.textContent="Saved synthetic probe history ("+record.points.length+" samples) · not measured sea data";
    }catch(error){status.textContent=String(error?.message||error)}
  });
  $("[data-wave-import]").addEventListener("change",async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      if(file.size>3000000)throw new Error("Wave CSV must be under 3 MB");
      const record=importWaveCSV(await file.text(),{filename:file.name});
      if(disposed)return;
      records=appendWaveRecord(records,record);persist();renderRecords();
      status.textContent="Imported "+record.points.length+" wave observations from "+file.name;
    }catch(error){status.textContent=String(error?.message||error)}
    event.target.value="";
  });
  $("[data-wave-estimate]").addEventListener("click",()=>{
    const output=$("[data-wave-estimate-output]");
    try{
      const wave=options();
      const added=legacyAddedWaveResistance({
        lwlM:$("[data-wave-lwl]").value,bwlM:$("[data-wave-bwl]").value,
        shipSpeedMs:$("[data-wave-speed]").value,
        waveHeightM:wave.heightM,waveHeadingDeg:wave.headingDeg
      });
      const morison=legacyMorisonWaveForce({
        waveHeightM:wave.heightM,wavePeriodS:wave.periodS,headingDeg:wave.headingDeg,
        projectedAreaM2:$("[data-wave-area]").value,volumeM3:$("[data-wave-volume]").value
      });
      output.textContent="Added resistance (concept): "+added.addedResistanceN.toFixed(1)+
        " N\nMorison force peak (concept): "+morison.forcePeakN.toFixed(1)+
        " N\nNot verified wave loads. No ship motions/RAOs or diffraction.";
    }catch(error){output.textContent="No result: "+String(error?.message||error)}
  });
  $("[data-wave-json]").addEventListener("change",async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      if(file.size>2500000)throw new Error("Wave library JSON exceeds 2.5 MB");
      const incoming=importWaveCollectionJSON(await file.text());
      if(disposed)return;
      for(const entry of incoming)records=appendWaveRecord(records,entry);
      persist();renderRecords();
      status.textContent="Restored "+incoming.length+" wave case(s) with provenance";
    }catch(error){status.textContent=String(error?.message||error)}
    event.target.value="";
  });
  $("[data-wave-export]").addEventListener("click",()=>downloadText(
    JSON.stringify({schemaVersion:1,kind:"wave-collection",records},null,2),
    "folknet-wave-collection.json","application/json"));
  for(const input of root.querySelectorAll("input[type=number]"))
    input.addEventListener("change",()=>{if(active)updateWave()});
  renderRecords();
  return {dispose(){disposed=true;root.remove();scene.actions.setWave({enabled:false})}};
}
