import {mountModelScene} from "../model/model-scene.js?v=228b73eb14255367ff327e4fa097975410ecc9e5";
import {mountWaveControls} from "../model/model-wave-controls.js?v=228b73eb14255367ff327e4fa097975410ecc9e5";
import {validateHydroModel} from "../model/hull-surface-validator.js?v=228b73eb14255367ff327e4fa097975410ecc9e5";
import {hydroPreflightHTML} from "../engineering/hydro-panel.js?v=228b73eb14255367ff327e4fa097975410ecc9e5";
import {modelHydroSummaryAtAttitude,parseModelBuffer} from "./model-inspector-core.js?v=228b73eb14255367ff327e4fa097975410ecc9e5";

function fmt(value,digits=4){
  const n=Number(value);
  return Number.isFinite(n)?n.toFixed(digits):"—";
}

function resultCard(label,value,unit=""){
  return '<div class="tool-result-card"><span>'+label+'</span><strong>'+value+'</strong><small>'+unit+'</small></div>';
}

export function modelInspectorHTML(){
  return '<main class="tool-page model-inspector-page">'+
    '<div class="crumbs">Courses / Tools / Advanced model inspector</div>'+
    '<header class="tool-header"><div><span class="project-kicker">Engineering tool</span><h1>Advanced model inspector</h1><p>Shared STL/3MF scene for alignment, measurement, model inspection and hydro checks.</p><div class="tool-parity-banner"><strong>Parity review:</strong> legacy camera, alignment, snap measurement, clipping, appearance, CG/CB, waterline, attitude hydro, PNG export and help workflows are represented in v2. The legacy viewer remains available until side-by-side interaction verification is complete.</div></div><div id="model-inspector-status" class="coolprop-engine-status">No model loaded</div></header>'+
    '<section class="model-inspector-layout">'+
      '<aside class="tool-inputs model-inspector-controls">'+
        '<input id="model-inspector-file" type="file" accept=".stl,.3mf" hidden>'+
        '<div class="crystal-toggle-grid"><button class="btn primary" id="model-load-file">Open STL/3MF</button><button class="btn" id="model-load-example">Load wedge example</button></div>'+
        '<div class="crystal-subpanel"><strong>Camera</strong><div class="crystal-toggle-grid"><button class="btn" data-model-action="fit">Fit</button><button class="btn" data-model-action="reset">Reset</button><button class="btn" data-model-action="zoomIn">Zoom +</button><button class="btn" data-model-action="zoomOut">Zoom −</button></div><label class="field"><span>View</span><select id="model-view"><option value="iso">Iso</option><option value="front">Front</option><option value="rear">Rear</option><option value="port">Port</option><option value="starboard">Starboard</option><option value="top">Top</option></select></label></div>'+
        '<div class="crystal-subpanel"><strong>Alignment</strong><div class="crystal-toggle-grid"><button class="btn" data-model-action="autoAlign">Auto boat</button><button class="btn" data-model-action="alignReset">Reset align</button><button class="btn" data-model-swap="yz">Swap Y/Z</button><button class="btn" data-model-swap="xz">Swap X/Z</button><button class="btn" data-model-swap="xy">Swap X/Y</button></div></div>'+
        '<div class="crystal-subpanel"><strong>Rotation / attitude</strong><div class="crystal-coordinate-grid"><label><span>Heel X°</span><input id="model-rot-x" type="number" step="1" value="0"></label><label><span>Trim Y°</span><input id="model-rot-y" type="number" step="1" value="0"></label><label><span>Yaw Z°</span><input id="model-rot-z" type="number" step="1" value="0"></label></div><button class="btn" id="model-rotation-reset">Reset attitude</button><p class="muted hydro-note">Hydro below uses the same heel/trim/yaw attitude values as the 3D view.</p></div>'+
        '<div class="crystal-subpanel"><strong>Appearance</strong><label class="field"><span>Opacity</span><input id="model-opacity" type="range" min="0.1" max="1" step="0.05" value="1"></label><label class="field"><span>Model color</span><input id="model-color" type="color" value="#8aa7b5"></label><label class="field"><span>Background</span><input id="model-background" type="color" value="#081820"></label><label class="field"><span><input id="model-wireframe" type="checkbox"> Wireframe</span></label></div>'+
        '<div class="crystal-subpanel"><strong>Measure</strong><div class="crystal-toggle-grid"><button class="btn" id="model-measure">Measure</button><button class="btn" id="model-measure-undo">Undo</button><button class="btn" id="model-measure-clear">Clear</button></div><label class="field"><span>Snap</span><select id="model-snap-mode"><option value="none">None</option><option value="vertex">Vertex</option><option value="edge">Edge</option><option value="both">Vertex + edge</option></select></label><label class="field"><span>Snap tolerance (m)</span><input id="model-snap-tolerance" type="number" min="0" step="0.001" value="0.01"></label><div id="model-measure-list" class="muted">No measurements.</div></div>'+
        '<div class="crystal-subpanel"><strong>Clipping</strong><label class="field"><span><input id="model-clip-enabled" type="checkbox"> Enable clip</span></label><label class="field"><span>Axis</span><select id="model-clip-axis"><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select></label><label class="field"><span>Offset (m)</span><input id="model-clip-offset" type="number" step="0.05" value="0"></label><label class="field"><span><input id="model-clip-invert" type="checkbox"> Invert</span></label></div>'+
        '<div class="crystal-subpanel"><strong>Hydro / waterline</strong><label class="field"><span>Waterline Z (m)</span><input id="model-waterline" type="number" step="0.05" value="0"></label><label class="field"><span><input id="model-waterline-visible" type="checkbox" checked> Show waterline</span></label><button class="btn primary" id="model-hydro-run">Validate hull + calculate</button></div>'+
        '<div id="model-inspector-wave-host"></div>'+
        '<div class="crystal-toggle-grid"><button class="btn" id="model-png">Save PNG</button><button class="btn" id="model-help">Help</button></div>'+
      '</aside>'+
      '<section class="model-inspector-main"><div id="model-inspector-stage" class="model-inspector-stage"></div><div id="model-inspector-results" class="model-inspector-results"></div></section>'+
    '</section>'+
    '<dialog id="model-help-dialog" class="chem-tips"><form method="dialog"><h3>Model inspector</h3><p><b>Auto boat</b> aligns the longest extent to X, next to Y and shortest to Z. Axis swaps and rotation are visual scene transforms. <b>Measure</b> uses two surface clicks. Hydro uses the original ModelDocument geometry and the selected horizontal waterline.</p><p>For full stability workflows, use Engineering → Hydro.</p><button class="btn primary">Close</button></form></dialog>'+
  '</main>';
}

export async function bindModelInspector(root){
  const stage=root.querySelector("#model-inspector-stage");
  const status=root.querySelector("#model-inspector-status");
  const results=root.querySelector("#model-inspector-results");
  const fileInput=root.querySelector("#model-inspector-file");
  const measureList=root.querySelector("#model-measure-list");
  let documentModel=null;
  let sceneHandle=null;
  let waveControls=null;
  let measureEnabled=false;
  let disposed=false;

  function setStatus(value){if(status)status.textContent=value}
  function renderMeasurements(items){
    if(!measureList)return;
    measureList.replaceChildren();
    if(!items.length){measureList.textContent="No measurements.";return}
    items.forEach((item,index)=>{
      const row=document.createElement("div");
      row.textContent="#"+(index+1)+" · "+fmt(item.distance,4)+" m";
      measureList.append(row);
    });
  }
  function renderHydro(){
    if(!documentModel)return;
    const waterline=Number(root.querySelector("#model-waterline")?.value)||0;
    const gate=validateHydroModel(documentModel);
    if(!gate.passed){
      results.innerHTML=hydroPreflightHTML(gate);
      setStatus(documentModel.name+" · geometry preflight failed; no hydro results");
      return;
    }
    try{
      const summary=modelHydroSummaryAtAttitude(documentModel,waterline,1025,{
        heel:Number(root.querySelector("#model-rot-x")?.value)||0,
        trim:Number(root.querySelector("#model-rot-y")?.value)||0,
        yaw:Number(root.querySelector("#model-rot-z")?.value)||0
      });
      const cb=summary.centerOfBuoyancy;
      const cg=summary.solidCentroid;
      results.innerHTML=hydroPreflightHTML(summary.geometryValidation)+'<div class="tool-result-grid">'+
        resultCard("Topology",summary.diagnostics.watertight?"Watertight":"Check geometry",summary.diagnostics.triangles+" triangles")+
        resultCard("Solid volume",fmt(summary.solidVolume,4),"m³")+
        resultCard("Geometric centroid",cg.map(v=>fmt(v,3)).join(", "),"x, y, z m")+
        resultCard("Submerged volume",fmt(summary.volume,4),"m³")+
        resultCard("Displacement",fmt(summary.displacementKg/1000,3),"tonnes @ 1025 kg/m³")+
        resultCard("Center of buoyancy",cb.map(v=>fmt(v,3)).join(", "),"x, y, z m")+
        resultCard("Waterplane area",fmt(summary.waterplane.area,4),"m²")+
        resultCard("Model size",summary.diagnostics.bounds.size.map(v=>fmt(v,3)).join(" × "),"m")+
        '</div>';
      setStatus(documentModel.name+" · "+documentModel.format);
    }catch(error){
      results.replaceChildren();
      const warning=document.createElement("div");warning.className="geometry-warning";
      const heading=document.createElement("strong");heading.textContent="Hydro warning";
      const message=document.createElement("span");message.textContent=String(error?.message||error);
      warning.append(heading,message);results.append(warning);
    }
  }

  async function mount(model){
    waveControls?.dispose?.();waveControls=null;
    sceneHandle?.cleanup?.();
    sceneHandle=null;
    documentModel=model;
    sceneHandle=await mountModelScene(stage,model,{showSidebar:true,onMeasurements:renderMeasurements});
    if(disposed){sceneHandle.cleanup();return}
    const bounds=sceneHandle.actions.getBounds();
    const wl=root.querySelector("#model-waterline");
    if(wl)wl.value=String(bounds.min[2]+bounds.size[2]*.5);
    sceneHandle.actions.setWaterline({visible:true,z:Number(wl?.value)||0});
    waveControls=mountWaveControls(root.querySelector("#model-inspector-wave-host"),sceneHandle);
    renderHydro();
  }

  async function loadExample(){
    setStatus("Loading example…");
    const response=await fetch("./examples/models/wedge.stl");
    if(!response.ok)throw new Error("Could not load wedge example");
    await mount(await parseModelBuffer(await response.arrayBuffer(),"wedge.stl"));
  }

  root.querySelector("#model-load-file")?.addEventListener("click",()=>fileInput.click());
  root.querySelector("#model-load-example")?.addEventListener("click",()=>loadExample().catch(error=>setStatus(String(error?.message||error))));
  fileInput.addEventListener("change",async()=>{
    const file=fileInput.files?.[0];
    if(!file)return;
    try{setStatus("Parsing "+file.name+"…");await mount(await parseModelBuffer(await file.arrayBuffer(),file.name))}catch(error){setStatus(String(error?.message||error))}
    fileInput.value="";
  });

  root.querySelectorAll("[data-model-action]").forEach(button=>button.addEventListener("click",()=>{
    const actions=sceneHandle?.actions;if(!actions)return;
    const name=button.dataset.modelAction;
    if(name==="fit")actions.fit();else if(name==="reset")actions.resetZoom();else if(name==="zoomIn")actions.zoomIn();else if(name==="zoomOut")actions.zoomOut();else if(name==="autoAlign")actions.autoAlign();else if(name==="alignReset")actions.resetAlignment();
  }));
  root.querySelectorAll("[data-model-swap]").forEach(button=>button.addEventListener("click",()=>sceneHandle?.actions.swapAxes(button.dataset.modelSwap)));
  root.querySelector("#model-view")?.addEventListener("change",event=>sceneHandle?.actions.setView(event.target.value));

  const applyRotation=()=>{
    sceneHandle?.actions.setRotation({
      x:Number(root.querySelector("#model-rot-x")?.value)||0,
      y:Number(root.querySelector("#model-rot-y")?.value)||0,
      z:Number(root.querySelector("#model-rot-z")?.value)||0
    });
    renderHydro();
  };
  for(const id of ["#model-rot-x","#model-rot-y","#model-rot-z"])root.querySelector(id)?.addEventListener("change",applyRotation);
  root.querySelector("#model-rotation-reset")?.addEventListener("click",()=>{
    for(const id of ["#model-rot-x","#model-rot-y","#model-rot-z"]){const input=root.querySelector(id);if(input)input.value="0"}
    sceneHandle?.actions.resetAttitude();
    renderHydro();
  });

  const applyAppearance=()=>sceneHandle?.actions.setAppearance({
    wireframe:root.querySelector("#model-wireframe")?.checked||false,
    opacity:Number(root.querySelector("#model-opacity")?.value)||1,
    modelColor:root.querySelector("#model-color")?.value||"#8aa7b5",
    background:root.querySelector("#model-background")?.value||"#081820"
  });
  for(const id of ["#model-wireframe","#model-opacity","#model-color","#model-background"])root.querySelector(id)?.addEventListener("input",applyAppearance);

  root.querySelector("#model-measure")?.addEventListener("click",event=>{
    measureEnabled=!measureEnabled;
    sceneHandle?.actions.setMeasurement(measureEnabled);
    event.currentTarget.classList.toggle("primary",measureEnabled);
  });
  root.querySelector("#model-measure-undo")?.addEventListener("click",()=>sceneHandle?.actions.undoMeasurement());
  root.querySelector("#model-measure-clear")?.addEventListener("click",()=>sceneHandle?.actions.clearMeasurements());
  const updateSnap=()=>sceneHandle?.actions.setMeasurementSnap({
    mode:root.querySelector("#model-snap-mode")?.value||"none",
    tolerance:Number(root.querySelector("#model-snap-tolerance")?.value)||0
  });
  root.querySelector("#model-snap-mode")?.addEventListener("change",updateSnap);
  root.querySelector("#model-snap-tolerance")?.addEventListener("change",updateSnap);

  const updateClip=()=>sceneHandle?.actions.setClipping({
    enabled:root.querySelector("#model-clip-enabled")?.checked||false,
    axis:root.querySelector("#model-clip-axis")?.value||"x",
    offset:Number(root.querySelector("#model-clip-offset")?.value)||0,
    invert:root.querySelector("#model-clip-invert")?.checked||false
  });
  for(const id of ["#model-clip-enabled","#model-clip-axis","#model-clip-offset","#model-clip-invert"]){
    root.querySelector(id)?.addEventListener("change",updateClip);
  }

  const updateWaterline=()=>sceneHandle?.actions.setWaterline({visible:root.querySelector("#model-waterline-visible")?.checked!==false,z:Number(root.querySelector("#model-waterline")?.value)||0});
  root.querySelector("#model-waterline")?.addEventListener("change",updateWaterline);
  root.querySelector("#model-waterline-visible")?.addEventListener("change",updateWaterline);
  root.querySelector("#model-hydro-run")?.addEventListener("click",()=>{updateWaterline();renderHydro()});
  root.querySelector("#model-png")?.addEventListener("click",()=>sceneHandle?.actions.screenshot("model-inspector.png"));
  root.querySelector("#model-help")?.addEventListener("click",()=>root.querySelector("#model-help-dialog")?.showModal?.());

  loadExample().catch(error=>setStatus(String(error?.message||error)));

  return {cleanup(){disposed=true;waveControls?.dispose?.();sceneHandle?.cleanup?.();sceneHandle=null}};
}