import {mountModelScene} from "../model/model-scene.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
import {mountWaveControls} from "../model/model-wave-controls.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
import {mountAssemblyInspector} from "./assembly-inspector.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
import {connectSpaceMouse} from "../model/spacemouse-webhid.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
import {spaceMouseMovement} from "../model/spacemouse-motion.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";
import {readSpaceMouseSettings,writeSpaceMouseSettings} from "../model/spacemouse-settings.js?v=5c34cd9839c43dc87281643c6b62b9c37893ec50";

export async function renderModelWorkbench(container,model,{showSidebar=false}={}){
  container.innerHTML=`<div class="model-viewer-workbench">
    <div class="model-viewer-stage" data-model-stage></div>
    <aside class="model-viewer-inspector">
      <div class="model-viewer-section">
        <strong>3D model</strong>
        <p class="model-cad-shortcuts">Mouse: left drag orbit, middle drag pan, Shift + middle drag orbit, wheel zoom.
          Focus 3D canvas: F fit · I iso · T top · 1–5 standard views · arrows pan · Shift+arrows orbit · +/- zoom · X explode · Esc reset.</p>
        <div class="model-viewer-actions">
          <button type="button" data-model-spacemouse>Connect 3D mouse</button>
          <button type="button" data-model-spacemouse-stop disabled>Disconnect</button>
        </div>
        <p class="muted" data-model-spacemouse-status role="status">SpaceMouse: optional WebHID in desktop Chrome/Edge over HTTPS. Permission required.</p>
        <div class="model-spacemouse-settings"><label>Sensitivity <input type="range" data-model-spacemouse-gain min=".2" max="2" step=".1" value=".6"></label><output data-model-spacemouse-gain-value>0.6×</output><label><input type="checkbox" data-model-spacemouse-invert> Invert zoom</label><a href="#/settings/engineering" data-spacemouse-settings-link>All 6-axis settings</a></div>
        <div class="model-viewer-actions">
          <button type="button" data-model-fit>Fit</button>
          <button type="button" data-model-iso>Iso</button>
          <button type="button" data-model-top>Top</button>
          <button type="button" data-model-side="front">Front</button>
          <button type="button" data-model-side="rear">Rear</button>
          <button type="button" data-model-side="port">Port</button>
          <button type="button" data-model-side="starboard">Starboard</button>
          <button type="button" data-model-auto>Auto align</button>
          <button type="button" data-model-align-reset>Reset align</button>
          <button type="button" data-model-png>PNG</button>
        </div>
        <label class="model-viewer-label">Camera
          <select data-model-view>
            <option value="iso">Isometric</option><option value="front">Front</option>
            <option value="rear">Rear</option><option value="port">Port</option>
            <option value="starboard">Starboard</option><option value="top">Top</option>
          </select>
        </label>
        <label class="model-viewer-label">Appearance
          <select data-model-appearance>
            <option value="solid">Solid</option>
            <option value="wireframe">Wireframe</option>
          </select>
        </label>
        <label class="model-viewer-label">Opacity
          <input data-model-opacity type="range" min=".1" max="1" step=".05" value="1">
        </label>
        <label class="model-viewer-label">Shading
          <select data-model-shading><option value="smooth">Smooth</option><option value="flat">Flat</option></select>
        </label>
        <div class="model-viewer-checkbox"><label><input data-model-axes type="checkbox"> Axes</label>
          <label><input data-model-bbox type="checkbox"> Bounds</label>
          <label><input data-model-edges type="checkbox"> Edges</label></div>
        <label class="model-viewer-label">Explode assembly (visual only)
          <input data-model-explode type="range" min="0" max="2" step=".05" value="0">
        </label>
      </div>
      <div class="model-viewer-section">
        <strong>Visual heel / trim / yaw</strong>
        <div class="model-wave-fields">
          <label>Heel X (°)<input data-model-roll type="number" step="1" value="0"></label>
          <label>Trim Y (°)<input data-model-trim type="number" step="1" value="0"></label>
          <label>Yaw Z (°)<input data-model-yaw type="number" step="1" value="0"></label>
        </div>
        <div class="model-viewer-actions" data-model-attitude-actions>
          <button type="button" data-model-tilt="roll:-5">Heel −5°</button>
          <button type="button" data-model-tilt="roll:5">Heel +5°</button>
          <button type="button" data-model-tilt="trim:-5">Trim −5°</button>
          <button type="button" data-model-tilt="trim:5">Trim +5°</button>
        </div>
        <button type="button" data-model-reset-rotation>Reset attitude</button>
      </div>
      <div class="model-viewer-section">
        <strong>Still-waterline (3D)</strong>
        <label class="model-viewer-label">Elevation Z (m)
          <input data-model-water-z type="number" step=".1" value="0">
        </label>
        <label class="model-viewer-checkbox">
          <input data-model-water-show type="checkbox" checked> Show waterplane and hull intersection
        </label>
        <p data-model-water-report role="status">Computing hull intersection…</p>
      </div>
      <div class="model-viewer-section">
        <strong>Section &amp; measurement</strong>
        <label class="model-viewer-checkbox"><input data-model-clip type="checkbox"> Clip model</label>
        <label class="model-viewer-label">Clip axis
          <select data-model-clip-axis><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select>
        </label>
        <label class="model-viewer-label">Clip offset (m)<input data-model-clip-offset type="number" step=".1" value="0"></label>
        <div class="model-viewer-actions">
          <button type="button" data-model-measure>Measure: Off</button>
          <button type="button" data-model-undo>Undo measure</button>
          <button type="button" data-model-clear>Clear</button>
        </div>
        <label class="model-viewer-label">Snap mode
          <select data-model-snap><option value="none">None</option>
            <option value="vertex">Vertex</option><option value="edge">Edge</option><option value="both">Both</option>
          </select>
        </label>
        <label class="model-viewer-label">Snap tolerance (m)
          <input data-model-snap-tol type="number" min="0" step=".001" value=".01">
        </label>
        <div class="model-viewer-measurements" aria-live="polite">Click two points on the 3D surface to measure.</div>
      </div>
      <div data-model-assembly></div>
      <div data-model-waves></div>
    </aside>
  </div>`;
  const stage=container.querySelector("[data-model-stage]");
  const report=container.querySelector("[data-model-water-report]");
  const measurementList=container.querySelector(".model-viewer-measurements");
  const scene=await mountModelScene(stage,model,{showSidebar,onMeasurements:measurements=>{
    measurementList.textContent=measurements.length?
      measurements.map((item,i)=>`#${i+1}: ${item.distance.toFixed(4)} m`).join(" · "):
      "Click two points on the 3D surface to measure.";
  }});
  const $=selector=>container.querySelector(selector);
  const bounds=scene.actions.getBounds();
  const waterInput=$("[data-model-water-z]");
  waterInput.value=String(bounds.min[2]+bounds.size[2]/2);
  function updateWaterline(){
    try{
      const result=scene.actions.setWaterline({
        visible:$("[data-model-water-show]").checked,z:Number(waterInput.value)
      });
      report.textContent=result.status==="ok"?
        `${result.loops.length} closed hull intersection contour(s) · ${result.segments} triangle cuts`:
        result.reason||"Waterline hidden.";
    }catch(error){report.textContent=String(error?.message||error)}
  }
  waterInput.addEventListener("change",updateWaterline);
  $("[data-model-water-show]").addEventListener("change",updateWaterline);
  for(const [selector,action] of [
    ["[data-model-fit]","fit"],["[data-model-iso]","resetZoom"],
    ["[data-model-top]","top"],["[data-model-auto]","autoAlign"],
    ["[data-model-align-reset]","resetAlignment"],["[data-model-png]","screenshot"],
    ["[data-model-undo]","undoMeasurement"],["[data-model-clear]","clearMeasurements"]
  ]){
    $(selector).addEventListener("click",()=>{
      if(action==="top")scene.actions.setView("top");
      else if(action==="screenshot")scene.actions.screenshot("model-view.png");
      else scene.actions[action]?.();
      if(action==="autoAlign"||action==="resetAlignment")updateWaterline();
    });
  }
  for(const side of container.querySelectorAll("[data-model-side]")){
    side.addEventListener("click",()=>{
      scene.actions.setView(side.dataset.modelSide);
      $("[data-model-view]").value=side.dataset.modelSide;
    });
  }
  const appearance=()=>{
    scene.actions.setAppearance({wireframe:$("[data-model-appearance]").value==="wireframe",
      opacity:Number($("[data-model-opacity]").value)});
  };
  $("[data-model-appearance]").addEventListener("change",appearance);
  $("[data-model-opacity]").addEventListener("input",appearance);
  $("[data-model-view]").addEventListener("change",event=>
    scene.actions.setView(event.currentTarget.value));
  $("[data-model-shading]").addEventListener("change",event=>
    scene.actions.setShading(event.currentTarget.value));
  for(const [selector,action] of [
    ["[data-model-axes]","setAxes"],["[data-model-bbox]","setBoundingBox"],
    ["[data-model-edges]","setEdges"]
  ])$(selector).addEventListener("change",event=>
    scene.actions[action](event.currentTarget.checked));
  $("[data-model-explode]").addEventListener("input",event=>{
    scene.actions.setExplode(Number(event.currentTarget.value));
    updateWaterline();
  });
  const applyRotation=()=>{
    scene.actions.setRotation({
      x:Number($("[data-model-roll]").value),
      y:Number($("[data-model-trim]").value),
      z:Number($("[data-model-yaw]").value)
    });updateWaterline();
  };
  for(const selector of ["[data-model-roll]","[data-model-trim]","[data-model-yaw]"])
    $(selector).addEventListener("input",applyRotation);
  for(const button of container.querySelectorAll("[data-model-tilt]"))
    button.addEventListener("click",()=>{
      const [axis,stepText]=button.dataset.modelTilt.split(":");
      const field=axis==="roll"?$("[data-model-roll]"):$("[data-model-trim]");
      const previous=Number(field.value);
      field.value=String(Math.max(-89,Math.min(89,(Number.isFinite(previous)?previous:0)+Number(stepText))));
      applyRotation();
    });
  $("[data-model-reset-rotation]").addEventListener("click",()=>{
    for(const selector of ["[data-model-roll]","[data-model-trim]","[data-model-yaw]"])
      $(selector).value="0";
    scene.actions.resetAttitude();updateWaterline();
  });
  const setSnap=()=>scene.actions.setMeasurementSnap({
    mode:$("[data-model-snap]").value,tolerance:Number($("[data-model-snap-tol]").value)});
  $("[data-model-snap]").addEventListener("change",setSnap);
  $("[data-model-snap-tol]").addEventListener("change",setSnap);
  const clip=()=>scene.actions.setClipping({
    enabled:$("[data-model-clip]").checked,
    axis:$("[data-model-clip-axis]").value,
    offset:Number($("[data-model-clip-offset]").value)
  });
  for(const selector of ["[data-model-clip]","[data-model-clip-axis]","[data-model-clip-offset]"])
    $(selector).addEventListener("change",clip);
  let measureEnabled=false;
  $("[data-model-measure]").addEventListener("click",event=>{
    measureEnabled=!measureEnabled;
    scene.actions.setMeasurement(measureEnabled);
    event.currentTarget.textContent=measureEnabled?"Measure: On":"Measure: Off";
  });
  updateWaterline();
  const assembly=mountAssemblyInspector($("[data-model-assembly]"),model,scene,{updateWaterline});
  const connectButton=$("[data-model-spacemouse]");
  const disconnectButton=$("[data-model-spacemouse-stop]");
  const connectionStatus=$("[data-model-spacemouse-status]");
  let session=null,connecting=false,disposed=false;
  const gain=$("[data-model-spacemouse-gain]");
  const inverted=$("[data-model-spacemouse-invert]");
  const sync3DSettings=()=>{
    const config=readSpaceMouseSettings();
    gain.value=String(config.sensitivity);inverted.checked=config.invertZoom;
    $("[data-model-spacemouse-gain-value]").textContent=gain.value+"×";
  };
  sync3DSettings();
  const onGlobal3DSettings=()=>sync3DSettings();
  window.addEventListener("folk:spacemouse-settings",onGlobal3DSettings);
  gain.addEventListener("input",()=>writeSpaceMouseSettings({sensitivity:Number(gain.value)}));
  inverted.addEventListener("change",()=>writeSpaceMouseSettings({invertZoom:inverted.checked}));
  if(!globalThis.navigator?.hid){
    connectButton.disabled=true;
    connectionStatus.textContent="WebHID unavailable. Use desktop Chrome or Edge over HTTPS; ordinary mouse/touch controls remain supported.";
  }
  const setConnectionStatus=message=>{if(!disposed)connectionStatus.textContent=message};
  const disconnect=async()=>{
    if(session){const existing=session;session=null;await existing.disconnect()}
    disconnectButton.disabled=true;connectButton.disabled=!globalThis.navigator?.hid;
  };
  connectButton.addEventListener("click",async()=>{
    if(session||connecting)return;
    connecting=true;connectButton.disabled=true;
    try{
      // requestDevice is invoked by the button gesture. No prompting on load.
      const selected=await connectSpaceMouse({
        isActive:()=>{
          const active=document.activeElement;
          return !disposed&&document.hasFocus()&&container.contains(active)&&
            !["INPUT","TEXTAREA","SELECT"].includes(active?.tagName);
        },
        onStatus:setConnectionStatus,
        onVector:sample=>{
          const motion=spaceMouseMovement(sample,readSpaceMouseSettings());
          if(motion)scene.actions.navigate3D(motion);
        }
      });
      if(disposed){await selected.disconnect();return}
      session=selected;disconnectButton.disabled=false;
      stage.querySelector("canvas")?.focus({preventScroll:true});
    }catch(error){setConnectionStatus(String(error?.message||error))}
    finally{connecting=false;if(!disposed&&!session)connectButton.disabled=!globalThis.navigator?.hid}
  });
  disconnectButton.addEventListener("click",()=>disconnect());
  const waveControls=mountWaveControls($("[data-model-waves]"),scene);
  return {...scene,info:scene.info+" · interactive 3D, hydro-waterline and wave collection",
    cleanup(){
      disposed=true;window.removeEventListener("folk:spacemouse-settings",onGlobal3DSettings);
      assembly.dispose();waveControls.dispose();
      void disconnect();scene.cleanup();
    }};
}
