import {areaLoadsFromLines,normaliseAreaLoad} from "../hydro/hull-loading.js?v=2e69355dfff68f7b24a4f8ed038f05081cb69e43";
import {pointWeightsFromLines} from "../hydro/point-loads.js?v=2e69355dfff68f7b24a4f8ed038f05081cb69e43";
import {
  planBounds,planMetersToPixel,sketchAreaLoad,sketchPointMass,
  areaLoadLine,pointMassLine,appendSketchLine,updateSketchDataRow,
  moveSketchAreaLoad,moveSketchPointMass,editSketchAreaProperties,
  editSketchPointProperties
} from "./load-sketch-core.js?v=2e69355dfff68f7b24a4f8ed038f05081cb69e43";
import {extractDeckSurfaceCandidates,deckSurfaceAt,sampledDeckFootprint} from "./deck-surface-projection.js?v=2e69355dfff68f7b24a4f8ed038f05081cb69e43";

/**
 * The validated text fields remain authoritative. Editing changes only the
 * selected data row; comments, other loads and line order are preserved.
 * No mass is applied to a physics solver until the user chooses Apply/Calculate.
 */
export function mountLoadSketch(host,{bounds,areaInput,pointInput,modelDocument=null}={}){
  if(!host||!areaInput||!pointInput)return()=>{};
  try{planBounds(bounds)}catch(error){host.textContent=error.message;return()=>{}}
  const width=600,height=300,size={width,height};
  const surfaces=modelDocument?extractDeckSurfaceCandidates(modelDocument):[];
  let activeSurface=surfaces.find(item=>item.declaredDeck)||null;
  host.innerHTML=
    '<div class="load-sketch-toolbar" role="group" aria-label="Load editing tools">'+
    '<button type="button" class="btn" data-sketch-mode="area" aria-pressed="true">Draw area load</button>'+
    '<button type="button" class="btn" data-sketch-mode="point" aria-pressed="false">Place point mass</button>'+
    '<button type="button" class="btn" data-sketch-mode="edit" aria-pressed="false">Select / move</button>'+
    '<button type="button" class="btn" data-sketch-undo disabled title="Undo the latest sketch change">Undo</button></div>'+
    '<label class="load-sketch-surface-control">Placement basis <select data-sketch-surface>'+ 
      '<option value="manual">Manual X/Y rectangle · not surface-validated</option>'+
      surfaces.map((item,i)=>'<option value="'+i+'" '+(item===activeSurface?'selected':'')+'>'+
        (item.declaredDeck?'Tagged deck':'Candidate horizontal mesh')+' · '+String(item.name).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))+
        ' · Z='+item.z.toFixed(2)+' m</option>').join('')+
      '</select></label>'+
    '<div class="load-sketch-settings">'+
    '<label>Area density · t/m² <input type="number" step="any" min=".000001" data-sketch-density value=".10"></label>'+
    '<label>Point mass · t <input type="number" step="any" data-sketch-mass value="1"></label>'+
    '<label>Height Z · m <input type="number" step="any" data-sketch-z value="0"></label></div>'+
    '<div class="load-sketch-frame"><svg viewBox="0 0 600 300" preserveAspectRatio="none" class="load-sketch-svg"'+
    ' aria-label="Hull plan: X right, Y up. Draw an area, place a mass, or select and drag an existing load" role="img"></svg></div>'+
    '<div class="load-sketch-selection" data-sketch-selection hidden>'+
    '<span data-sketch-selection-label></span>'+
    '<button type="button" class="btn" data-sketch-save>Update mass / height</button>'+
    '<button type="button" class="btn" data-sketch-delete>Remove selected</button>'+
    '<button type="button" class="btn" data-sketch-clear>Clear selection</button></div>'+
    '<p class="load-sketch-status" data-sketch-status aria-live="polite">Drag to draw an area. X rightwards, Y upwards; enter Z above.</p>'+
    '<small>Projected plan rectangle, not an exact deck surface. Loads are masses, not forces. '+
    'The text fields remain editable. Select / move lets you drag existing loads; '+
    'Apply/Calculate runs the actual mass and CG solver.</small>';
  const svg=host.querySelector("svg");
  const status=host.querySelector("[data-sketch-status]");
  const density=host.querySelector("[data-sketch-density]");
  const mass=host.querySelector("[data-sketch-mass]");
  const z=host.querySelector("[data-sketch-z]");
  const surfaceInput=host.querySelector("[data-sketch-surface]");
  const surfaceNote=activeSurface?activeSurface.declaredDeck?
    "Tagged mesh surface: verify deck loading suitability independently.":
    "Unverified upward-facing mesh candidate; not a certified loading deck.":
    "Manual bounds; no actual deck coverage check.";
  const note=document.createElement("small");
  note.setAttribute("data-sketch-surface-note","");
  host.querySelector(".load-sketch-frame").after(note);
  note.textContent=surfaceNote;
  if(activeSurface){z.value=String(activeSurface.z);z.readOnly=true}
  surfaceInput.addEventListener("change",()=>{
    activeSurface=surfaceInput.value==="manual"?null:surfaces[Number(surfaceInput.value)]||null;
    z.readOnly=Boolean(activeSurface);
    if(activeSurface)z.value=String(activeSurface.z);
    note.textContent=activeSurface?(activeSurface.declaredDeck?
      "Tagged horizontal mesh surface. Density and structural capacity are not verified.":
      "Unverified candidate horizontal mesh surface: confirm it is a load-bearing deck."):
      "Manual bounding-box placement: loads are not checked against the actual mesh.";
    selected=null;drag=null;render();
  });
  function enforceSurface(kind,load){
    if(!activeSurface)return load;
    if(kind==="area"){
      if(Math.abs(load.z-activeSurface.z)>.001)throw Error("Z must equal selected surface height");
      const check=sampledDeckFootprint(activeSurface,load);
      if(!check.accepted)throw Error("Area extends beyond the selected mesh surface (sampled coverage "+Math.round(check.coverage*100)+"%). Choose a smaller rectangle or manual mode.");
    }else{
      if(Math.abs(load.z-activeSurface.z)>.001)throw Error("Z must equal selected surface height");
      if(!deckSurfaceAt(activeSurface,load.x,load.y))
        throw Error("Point lies outside the selected mesh surface; move onto a highlighted triangle.");
    }
    return load;
  }
  const selectionBar=host.querySelector("[data-sketch-selection]");
  const selectionLabel=host.querySelector("[data-sketch-selection-label]");
  const undoButton=host.querySelector("[data-sketch-undo]");
  const toolbar=host.querySelector(".load-sketch-toolbar");
  let mode="area",drag=null,selected=null,undo=null,disposed=false;
  const n=value=>Number(value.toFixed(3));
  const inputFor=kind=>kind==="area"?areaInput:pointInput;
  const lineFor=(kind,load)=>kind==="area"?areaLoadLine(load):pointMassLine(load);
  function readInputs(){
    // Reject invalid pre-existing rows before attempting to mutate either field.
    return {
      areas:areaLoadsFromLines(areaInput.value).map((a,index)=>normaliseAreaLoad(a,index)),
      points:pointWeightsFromLines(pointInput.value).map((p,index)=>{
        if(p.massTonnes===0)throw Error("Point mass line "+(index+1)+" cannot be zero");
        return p;
      })
    };
  }
  function at(event){
    const rect=svg.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)throw Error("Drawing is not visible");
    return {
      x:Math.max(0,Math.min(width,(event.clientX-rect.left)/rect.width*width)),
      y:Math.max(0,Math.min(height,(event.clientY-rect.top)/rect.height*height))
    };
  }
  function currentSelection(loads){
    if(!selected)return null;
    const list=selected.kind==="area"?loads.areas:loads.points;
    return list[selected.index]||null;
  }
  function refreshSelection(loads){
    const load=currentSelection(loads);
    if(!load){selected=null;selectionBar.hidden=true;return}
    selectionBar.hidden=false;
    selectionLabel.textContent=(selected.kind==="area"?"Area load ":"Point mass ")+(selected.index+1);
  }
  function render(){
    if(disposed)return;
    let loads={areas:[],points:[]};
    try{loads=readInputs()}
    catch(error){
      status.textContent="Invalid load rows: "+error.message+". Correct the text before editing; no data was changed.";
      selected=null;
    }
    const b=planBounds(bounds);
    const grid=[];
    for(let i=1;i<5;i++){
      const x=i/5*width,y=i/5*height;
      grid.push('<path d="M'+n(x)+' 0V'+height+'M0 '+n(y)+'H'+width+'" stroke="currentColor" opacity=".10"/>');
    }
    const boxes=loads.areas.map((load,index)=>{
      const tl=planMetersToPixel(load.x0,load.y1,bounds,size);
      const br=planMetersToPixel(load.x1,load.y0,bounds,size);
      const active=selected?.kind==="area"&&selected.index===index;
      return '<rect data-sketch-area="'+index+'" x="'+n(tl.x)+'" y="'+n(tl.y)+
        '" width="'+n(br.x-tl.x)+'" height="'+n(br.y-tl.y)+
        '" fill="var(--accent)" fill-opacity="'+(active?".34":".17")+
        '" stroke="var(--accent)" stroke-width="'+(active?4:2)+'"/>';
    });
    const dots=loads.points.map((load,index)=>{
      const p=planMetersToPixel(load.x,load.y,bounds,size);
      const active=selected?.kind==="point"&&selected.index===index;
      return '<circle data-sketch-point="'+index+'" cx="'+n(p.x)+'" cy="'+n(p.y)+
        '" r="'+(active?8:5)+'" fill="var(--danger)" stroke="var(--surface)" stroke-width="2"/>';
    });
    const deckPolygons=activeSurface?activeSurface.triangles.slice(0,5000).map(triangle=>
      '<polygon points="'+triangle.map(p=>{
        const q=planMetersToPixel(p[0],p[1],bounds,size);
        return n(q.x)+','+n(q.y);
      }).join(' ')+'" fill="var(--accent)" fill-opacity=".15" stroke="var(--accent)" stroke-opacity=".32" stroke-width=".6" pointer-events="none"/>').join(""):"";
    svg.innerHTML='<rect width="'+width+'" height="'+height+'" fill="var(--surface-sunk)"/>'+
      deckPolygons+
      grid.join("")+boxes.join("")+dots.join("")+
      '<path d="M1 1H599V299H1Z" fill="none" stroke="var(--line-strong)" stroke-width="2" pointer-events="none"/>'+
      '<text x="12" y="19" font-size="12" fill="var(--ink)" pointer-events="none">Y '+n(b.y1)+' m</text>'+
      '<text x="12" y="292" font-size="12" fill="var(--ink)" pointer-events="none">Y '+n(b.y0)+' m</text>'+
      '<text x="12" y="37" font-size="11" fill="var(--ink-2)" pointer-events="none">X '+n(b.x0)+' m</text>'+
      '<text x="588" y="292" text-anchor="end" font-size="12" fill="var(--ink)" pointer-events="none">X '+n(b.x1)+' m</text>'+
      '<g data-sketch-preview pointer-events="none"></g>';
    refreshSelection(loads);
    undoButton.disabled=!undo;
  }
  function select(kind,index,loads){
    selected={kind,index};
    const load=currentSelection(loads);
    if(!load)throw Error("Selected load no longer exists");
    z.value=String(load.z);
    if(kind==="area")density.value=String(load.densityTonnesPerM2);
    else mass.value=String(load.massTonnes);
    render();
    status.textContent="Selected "+(kind==="area"?"area load ":"point mass ")+(index+1)+
      ". Drag to move, update mass / height, or remove. Click Apply/Calculate afterwards.";
  }
  function mutate(kind,index,updated,previousText){
    const input=inputFor(kind);
    if(input.value!==previousText)throw Error("Load text changed while editing. Select again.");
    const next=updateSketchDataRow(previousText,index,updated===null?null:lineFor(kind,updated));
    // Validate the entire resulting field before committing.
    if(kind==="area")areaLoadsFromLines(next).map((a,i)=>normaliseAreaLoad(a,i));
    else{
      const rows=pointWeightsFromLines(next);
      if(rows.some(p=>p.massTonnes===0))throw Error("A point mass cannot be zero");
    }
    if(next===previousText)return;
    undo={input,before:previousText,after:next};
    input.value=next;
    input.dispatchEvent(new Event("input",{bubbles:true}));
  }
  function onMode(event){
    const button=event.target.closest("[data-sketch-mode]");
    if(button){
      mode=button.dataset.sketchMode;
      selected=null;drag=null;
      host.querySelectorAll("[data-sketch-mode]").forEach(b=>
        b.setAttribute("aria-pressed",String(b.dataset.sketchMode===mode)));
      render();
      status.textContent=mode==="area"?"Drag a rectangle to add an area mass at Z.":
        mode==="point"?"Click to place a point mass. Negative tonnes remove mass.":
        "Click an existing area or point to select; drag it to change X/Y.";
      return;
    }
    if(!event.target.closest("[data-sketch-undo]"))return;
    if(!undo)return;
    if(undo.input.value!==undo.after){
      status.textContent="Cannot undo: the load rows were edited since the last sketch change.";
      undo=null;render();return;
    }
    const saved=undo;
    undo=null;
    saved.input.value=saved.before;
    saved.input.dispatchEvent(new Event("input",{bubbles:true}));
    selected=null;render();
    status.textContent="Last sketch change undone. Recalculate to update the analysis.";
  }
  function preview(to){
    const target=svg.querySelector("[data-sketch-preview]");
    if(!target||!drag)return;
    const start=drag.start;
    try{
      if(drag.kind==="moving"&&drag.load){
        const moved=drag.selected.kind==="area"?
          moveSketchAreaLoad(drag.load,start,to,bounds,size):
          moveSketchPointMass(drag.load,to,bounds,size);
        if(drag.selected.kind==="area"){
          const tl=planMetersToPixel(moved.x0,moved.y1,bounds,size);
          const br=planMetersToPixel(moved.x1,moved.y0,bounds,size);
          target.innerHTML='<rect x="'+n(tl.x)+'" y="'+n(tl.y)+'" width="'+n(br.x-tl.x)+
            '" height="'+n(br.y-tl.y)+'" fill="none" stroke="var(--accent)" stroke-dasharray="5 4" stroke-width="3"/>';
        }else{
          const p=planMetersToPixel(moved.x,moved.y,bounds,size);
          target.innerHTML='<circle cx="'+n(p.x)+'" cy="'+n(p.y)+
            '" r="10" fill="none" stroke="var(--danger)" stroke-dasharray="5 4" stroke-width="3"/>';
        }
      }else if(drag.kind==="area"){
        target.innerHTML='<rect x="'+n(Math.min(start.x,to.x))+'" y="'+n(Math.min(start.y,to.y))+
          '" width="'+n(Math.abs(to.x-start.x))+'" height="'+n(Math.abs(to.y-start.y))+
          '" fill="var(--accent)" fill-opacity=".30" stroke="var(--accent)" stroke-dasharray="5 4" stroke-width="2"/>';
      }
    }catch(error){status.textContent=error.message}
  }
  function onDown(event){
    if(event.button!==0||disposed)return;
    try{
      const start=at(event);
      const loads=readInputs();
      if(mode==="edit"){
        const rect=event.target.closest("[data-sketch-area]");
        const dot=event.target.closest("[data-sketch-point]");
        if(!rect&&!dot){
          selected=null;render();
          status.textContent="Choose an existing colored rectangle or red mass point.";
          return;
        }
        const kind=rect?"area":"point",index=Number((rect||dot).dataset[rect?"sketchArea":"sketchPoint"]);
        select(kind,index,loads);
        drag={kind:"moving",start,selected:{kind,index},
          load:kind==="area"?loads.areas[index]:loads.points[index],
          areaText:areaInput.value,pointText:pointInput.value};
      }else drag={kind:mode,start};
      svg.setPointerCapture?.(event.pointerId);
      if(mode==="area")preview(start);
    }catch(error){drag=null;status.textContent=error.message}
  }
  function onMove(event){
    if(!drag)return;
    try{preview(at(event))}catch(error){status.textContent=error.message}
  }
  function onUp(event){
    if(!drag||disposed)return;
    const current=drag;drag=null;
    try{
      const end=at(event),distance=Math.hypot(end.x-current.start.x,end.y-current.start.y);
      if(current.kind==="moving"){
        if(distance<3){render();return}
        const {kind,index}=current.selected;
        if(areaInput.value!==current.areaText||pointInput.value!==current.pointText)
          throw Error("Load rows changed during dragging; please select the load again");
        const relocated=kind==="area"?
          moveSketchAreaLoad(current.load,current.start,end,bounds,size):
          moveSketchPointMass(current.load,end,bounds,size);
        enforceSurface(kind,relocated);
        mutate(kind,index,relocated,inputFor(kind).value);
        status.textContent="Moved "+(kind==="area"?"area load ":"point mass ")+(index+1)+
          " without changing mass or Z. Click Apply/Calculate to solve.";
      }else if(current.kind==="area"){
        const area=enforceSurface("area",sketchAreaLoad(current.start,end,bounds,density.value,z.value,size));
        readInputs();
        const before=areaInput.value;
        undo={input:areaInput,before,after:appendSketchLine(before,areaLoadLine(area))};
        areaInput.value=undo.after;
        areaInput.dispatchEvent(new Event("input",{bubbles:true}));
        status.textContent="Added "+area.areaM2.toFixed(2)+" m², "+
          area.massTonnes.toFixed(3)+" t at Z="+area.z+" m. Click Apply/Calculate.";
      }else if(current.kind==="point"){
        const added=enforceSurface("point",sketchPointMass(end,bounds,mass.value,z.value,size));
        readInputs();
        const before=pointInput.value;
        undo={input:pointInput,before,after:appendSketchLine(before,pointMassLine(added))};
        pointInput.value=undo.after;
        pointInput.dispatchEvent(new Event("input",{bubbles:true}));
        status.textContent="Added "+added.massTonnes+" t at X="+added.x.toFixed(2)+
          ", Y="+added.y.toFixed(2)+", Z="+added.z+" m. Click Apply/Calculate.";
      }
    }catch(error){status.textContent="Load unchanged: "+error.message}
    render();
  }
  function onAction(event){
    if(event.target.closest("[data-sketch-clear]")){
      selected=null;render();status.textContent="Selection cleared.";return;
    }
    if(!selected)return;
    if(!event.target.closest("[data-sketch-save],[data-sketch-delete]"))return;
    try{
      const loads=readInputs(),load=currentSelection(loads);
      if(!load)throw Error("The selected load no longer exists");
      const {kind,index}=selected,original=inputFor(kind).value;
      if(event.target.closest("[data-sketch-delete]")){
        mutate(kind,index,null,original);
        selected=null;
        status.textContent="Selected load removed; click Apply/Calculate to recalculate.";
      }else{
        const updated=kind==="area"?
          editSketchAreaProperties(load,density.value,z.value):
          editSketchPointProperties(load,mass.value,z.value);
        enforceSurface(kind,updated);
        mutate(kind,index,updated,original);
        status.textContent="Mass / elevation updated. Click Apply/Calculate.";
      }
    }catch(error){status.textContent="Load unchanged: "+error.message}
    render();
  }
  function onCancel(){drag=null;render()}
  toolbar.addEventListener("click",onMode);
  selectionBar.addEventListener("click",onAction);
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
    selectionBar.removeEventListener("click",onAction);
    svg.removeEventListener("pointerdown",onDown);
    svg.removeEventListener("pointermove",onMove);
    svg.removeEventListener("pointerup",onUp);
    svg.removeEventListener("pointercancel",onCancel);
    areaInput.removeEventListener("input",render);
    pointInput.removeEventListener("input",render);
  };
}
