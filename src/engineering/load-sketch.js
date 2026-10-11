import {areaLoadsFromLines} from "../hydro/hull-loading.js";
import {pointWeightsFromLines} from "../hydro/point-loads.js";
import {planBounds,planMetersToPixel,sketchAreaLoad,sketchPointMass,
  areaLoadLine,pointMassLine,appendSketchLine} from "./load-sketch-core.js";

/** The validated text fields remain authoritative; drawing only adds input rows. */
export function mountLoadSketch(host,{bounds,areaInput,pointInput}={}){
  if(!host||!areaInput||!pointInput)return()=>{};
  try{planBounds(bounds)}catch(error){host.textContent=error.message;return()=>{}}
  const width=600,height=300;
  host.innerHTML=
    '<div class="load-sketch-toolbar" role="group" aria-label="Select load type">'+
    '<button type="button" class="btn" data-sketch-mode="area" aria-pressed="true">Draw area load</button>'+
    '<button type="button" class="btn" data-sketch-mode="point" aria-pressed="false">Place point mass</button></div>'+
    '<div class="load-sketch-settings">'+
    '<label>Area density · t/m² <input type="number" step="any" min=".000001" data-sketch-density value=".10"></label>'+
    '<label>Point mass · t <input type="number" step="any" data-sketch-mass value="1"></label>'+
    '<label>Height Z · m <input type="number" step="any" data-sketch-z value="0"></label></div>'+
    '<div class="load-sketch-frame"><svg viewBox="0 0 600 300" preserveAspectRatio="none" class="load-sketch-svg"'+
    ' aria-label="Hull top view: X right, Y up. Drag to draw rectangular area loads or click to place a mass point" role="img"></svg></div>'+
    '<p class="load-sketch-status" data-sketch-status aria-live="polite">Drag to draw an area. X rightwards, Y upwards; enter Z above.</p>'+
    '<small>Projected plan rectangle, not an exact deck surface. Loads are masses, not applied forces. The original rows remain editable; press Apply/Calculate to solve.</small>';
  const svg=host.querySelector("svg");
  const status=host.querySelector("[data-sketch-status]");
  const density=host.querySelector("[data-sketch-density]");
  const mass=host.querySelector("[data-sketch-mass]");
  const z=host.querySelector("[data-sketch-z]");
  let mode="area",drag=null,disposed=false;
  const n=value=>Number(value.toFixed(3));
  const point=event=>{
    const rect=svg.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)throw Error("Drawing is not visible");
    return {x:Math.max(0,Math.min(width,(event.clientX-rect.left)/rect.width*width)),
      y:Math.max(0,Math.min(height,(event.clientY-rect.top)/rect.height*height))};
  };
  function render(){
    if(disposed)return;
    let areas=[],points=[];
    try{areas=areaLoadsFromLines(areaInput.value);points=pointWeightsFromLines(pointInput.value)}
    catch(error){status.textContent="Input preview: "+error.message+". Original text preserved."}
    const b=planBounds(bounds);
    const grid=[];
    for(let i=1;i<5;i++){
      const x=i/5*width,y=i/5*height;
      grid.push('<path d="M'+n(x)+' 0V'+height+'M0 '+n(y)+'H'+width+'" stroke="currentColor" opacity=".10"/>');
    }
    const boxes=areas.map((area,index)=>{
      const tl=planMetersToPixel(area.x0,area.y1,bounds,{width,height});
      const br=planMetersToPixel(area.x1,area.y0,bounds,{width,height});
      return '<rect data-sketch-area="'+index+'" x="'+n(tl.x)+'" y="'+n(tl.y)+
        '" width="'+n(br.x-tl.x)+'" height="'+n(br.y-tl.y)+
        '" fill="var(--accent)" fill-opacity=".17" stroke="var(--accent)" stroke-width="2"/>';
    });
    const dots=points.map((massPoint,index)=>{
      const p=planMetersToPixel(massPoint.x,massPoint.y,bounds,{width,height});
      return '<circle data-sketch-point="'+index+'" cx="'+n(p.x)+'" cy="'+n(p.y)+
        '" r="5" fill="var(--danger)" stroke="var(--surface)" stroke-width="2"/>';
    });
    svg.innerHTML='<rect width="'+width+'" height="'+height+'" fill="var(--surface-sunk)"/>'+
      grid.join("")+boxes.join("")+dots.join("")+
      '<path d="M1 1H599V299H1Z" fill="none" stroke="var(--line-strong)" stroke-width="2"/>'+
      '<text x="12" y="19" font-size="12" fill="var(--ink)">Y '+n(b.y1)+' m</text>'+
      '<text x="12" y="292" font-size="12" fill="var(--ink)">Y '+n(b.y0)+' m</text>'+
      '<text x="12" y="37" font-size="11" fill="var(--ink-2)">X '+n(b.x0)+' m</text>'+
      '<text x="588" y="292" text-anchor="end" font-size="12" fill="var(--ink)">X '+n(b.x1)+' m</text>'+
      '<g data-sketch-preview></g>';
  }
  const onMode=event=>{
    const button=event.target.closest("[data-sketch-mode]");
    if(!button)return;
    mode=button.dataset.sketchMode;
    host.querySelectorAll("[data-sketch-mode]").forEach(b=>
      b.setAttribute("aria-pressed",String(b.dataset.sketchMode===mode)));
    status.textContent=mode==="area"?
      "Drag a rectangle to add a mass-per-area patch at the chosen Z.":
      "Click to place a mass point. Negative point masses represent removed weight.";
  };
  function preview(at){
    const target=svg.querySelector("[data-sketch-preview]");
    if(!target||!drag)return;
    target.innerHTML='<rect x="'+n(Math.min(drag.x,at.x))+'" y="'+n(Math.min(drag.y,at.y))+
      '" width="'+n(Math.abs(at.x-drag.x))+'" height="'+n(Math.abs(at.y-drag.y))+
      '" fill="var(--accent)" fill-opacity=".30" stroke="var(--accent)" stroke-dasharray="5 4" stroke-width="2"/>';
  }
  function onDown(event){
    if(event.button!==0||disposed)return;
    try{drag=point(event);svg.setPointerCapture?.(event.pointerId);if(mode==="area")preview(drag)}
    catch(error){status.textContent=error.message}
  }
  function onMove(event){if(drag&&mode==="area")preview(point(event))}
  function onUp(event){
    if(!drag||disposed)return;
    const start=drag;drag=null;
    try{
      const end=point(event);
      if(mode==="area"){
        const area=sketchAreaLoad(start,end,bounds,density.value,z.value,{width,height});
        areaInput.value=appendSketchLine(areaInput.value,areaLoadLine(area));
        areaInput.dispatchEvent(new Event("input",{bubbles:true}));
        status.textContent="Added "+area.areaM2.toFixed(2)+" m², "+area.massTonnes.toFixed(3)+" t at Z="+area.z+" m. Apply/Calculate to solve.";
      }else{
        const located=sketchPointMass(end,bounds,mass.value,z.value,{width,height});
        pointInput.value=appendSketchLine(pointInput.value,pointMassLine(located));
        pointInput.dispatchEvent(new Event("input",{bubbles:true}));
        status.textContent="Added "+located.massTonnes+" t at X="+located.x.toFixed(2)+
          ", Y="+located.y.toFixed(2)+", Z="+located.z+" m. Apply/Calculate to solve.";
      }
    }catch(error){status.textContent="Load not added: "+error.message}
    render();
  }
  function onCancel(){drag=null;render()}
  const toolbar=host.querySelector(".load-sketch-toolbar");
  toolbar.addEventListener("click",onMode);
  svg.addEventListener("pointerdown",onDown);
  svg.addEventListener("pointermove",onMove);
  svg.addEventListener("pointerup",onUp);
  svg.addEventListener("pointercancel",onCancel);
  areaInput.addEventListener("input",render);
  pointInput.addEventListener("input",render);
  render();
  return ()=>{
    disposed=true;
    toolbar.removeEventListener("click",onMode);
    svg.removeEventListener("pointerdown",onDown);
    svg.removeEventListener("pointermove",onMove);
    svg.removeEventListener("pointerup",onUp);
    svg.removeEventListener("pointercancel",onCancel);
    areaInput.removeEventListener("input",render);
    pointInput.removeEventListener("input",render);
  };
}
