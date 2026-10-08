import {mountModelScene} from "../model/model-scene.js";
import {mountWaveControls} from "../model/model-wave-controls.js";

export async function renderModelWorkbench(container,model,{showSidebar=false}={}){
  container.innerHTML=`<div class="model-viewer-workbench">
    <div class="model-viewer-stage" data-model-stage></div>
    <aside class="model-viewer-inspector">
      <div class="model-viewer-section">
        <strong>3D model</strong>
        <div class="model-viewer-actions">
          <button type="button" data-model-fit>Fit</button>
          <button type="button" data-model-iso>Iso</button>
          <button type="button" data-model-top>Top</button>
          <button type="button" data-model-auto>Auto align</button>
          <button type="button" data-model-align-reset>Reset align</button>
          <button type="button" data-model-png>PNG</button>
        </div>
        <label class="model-viewer-label">Appearance
          <select data-model-appearance>
            <option value="solid">Solid</option>
            <option value="wireframe">Wireframe</option>
          </select>
        </label>
        <label class="model-viewer-label">Opacity
          <input data-model-opacity type="range" min=".1" max="1" step=".05" value="1">
        </label>
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
        <div class="model-viewer-measurements" aria-live="polite">Click two points on the 3D surface to measure.</div>
      </div>
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
  const appearance=()=>{
    scene.actions.setAppearance({wireframe:$("[data-model-appearance]").value==="wireframe",
      opacity:Number($("[data-model-opacity]").value)});
  };
  $("[data-model-appearance]").addEventListener("change",appearance);
  $("[data-model-opacity]").addEventListener("input",appearance);
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
  const waveControls=mountWaveControls($("[data-model-waves]"),scene);
  return {...scene,info:scene.info+" · interactive 3D, hydro-waterline and wave collection",
    cleanup(){waveControls.dispose();scene.cleanup()}};
}
