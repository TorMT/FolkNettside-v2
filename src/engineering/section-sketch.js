import {parseStructuralMembers,sectionProperties}
  from "../structure/girder-section-properties.js?v=049c8c57c897de04c69668ecf1b175c29f8b840a";
import {structuralOverlapAudit,memberFootprint}
  from "../structure/girder-section-geometry.js?v=049c8c57c897de04c69668ecf1b175c29f8b840a";
import {insertSectionMember,updateSectionRow,translateSectionMember,
  sectionDrawBounds,sectionPixelToMeters,sectionMetersToPixel}
  from "./section-sketch-core.js?v=049c8c57c897de04c69668ecf1b175c29f8b840a";

/**
 * An optional visual Y/Z editor for the authoritative human-readable member
 * CSV. It never alters loading, reruns FEM, or rewrites other rows silently.
 *
 * Modes: select+move, draw plate, place rectangular stiffener.
 * All member dimensions and material properties remain editable numerically,
 * so touch/keyboard users do not need accurate dragging.
 */
export function mountSectionSketch(host,{textInput,modelBounds}={}){
  if(!host||!textInput)return()=>{};
  const size={width:640,height:340};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
  host.innerHTML=
    '<section class="section-sketch" aria-label="Visual structural cross-section editor">'+
    '<div class="section-sketch-toolbar" role="group" aria-label="Structural member tools">'+
    '<button class="btn" type="button" data-section-mode="select" aria-pressed="true">Select / drag</button>'+
    '<button class="btn" type="button" data-section-mode="plate" aria-pressed="false">Draw plate</button>'+
    '<button class="btn" type="button" data-section-mode="stiffener" aria-pressed="false">Place stiffener</button>'+
    '<button class="btn" type="button" data-section-undo disabled>Undo</button></div>'+
    '<div class="section-sketch-settings">'+
    '<label>Section <select data-section-station></select></label>'+
    '<label>X start (m) <input type="number" step="any" data-section-x0></label>'+
    '<label>X end (m) <input type="number" step="any" data-section-x1></label></div>'+
    '<div class="section-sketch-settings">'+
    '<label>Plate thickness (m) <input data-section-thickness type="number" step="any" min=".000001" value=".012"></label>'+
    '<label>Stiffener width Y (m) <input data-section-width type="number" step="any" min=".000001" value=".12"></label>'+
    '<label>Stiffener height Z (m) <input data-section-height type="number" step="any" min=".000001" value=".15"></label>'+
    '<label>E (GPa) <input data-section-E type="number" step="any" min=".001" value="210"></label>'+
    '<label>Density (kg/m³) <input data-section-rho type="number" step="any" min=".001" value="7850"></label></div>'+
    '<div class="section-sketch-canvas"><svg viewBox="0 0 640 340" preserveAspectRatio="none" '+
    'aria-label="Transverse Y horizontal, vertical Z upwards; edit structural members" role="img"></svg></div>'+
    '<div data-section-live class="section-sketch-live" aria-live="polite"></div>'+
    '<div data-section-selected hidden class="section-sketch-selected">'+
    '<strong data-section-selected-name></strong>'+
    '<div data-section-fields class="section-sketch-fields"></div>'+
    '<button type="button" class="btn" data-section-update>Update selected member</button>'+
    '<button type="button" class="btn" data-section-delete>Remove selected</button>'+
    '<button type="button" class="btn" data-section-clear>Clear selection</button></div>'+
    '<p data-section-warning class="section-sketch-warning" hidden role="status"></p>'+
    '<p data-section-status class="section-sketch-status" aria-live="polite">Choose Draw plate, drag in the Y/Z plane, then calculate the structural beam.</p>'+
    '<small>Positions are in metres. Plate width on screen represents entered thickness, not a hull surface. '+
    'Physical member intersections are checked and must be corrected before calculating EI and mass. '+
    'Manual CSV remains authoritative; Apply/Calculate still runs the solver.</small></section>';
  const svg=host.querySelector("svg");
  const live=host.querySelector("[data-section-live]");
  const stationSelect=host.querySelector("[data-section-station]");
  const x0=host.querySelector("[data-section-x0]"),x1=host.querySelector("[data-section-x1]");
  const thickness=host.querySelector("[data-section-thickness]");
  const memberWidth=host.querySelector("[data-section-width]");
  const memberHeight=host.querySelector("[data-section-height]");
  const E=host.querySelector("[data-section-E]");
  const rho=host.querySelector("[data-section-rho]");
  const warning=host.querySelector("[data-section-warning]");
  const status=host.querySelector("[data-section-status]");
  const undoButton=host.querySelector("[data-section-undo]");
  const details=host.querySelector("[data-section-selected]");
  const fields=host.querySelector("[data-section-fields]");
  const name=host.querySelector("[data-section-selected-name]");
  const toolbar=host.querySelector(".section-sketch-toolbar");
  const finite=Number.isFinite,round=n=>Number(n.toFixed(3));
  let disposed=false,mode="select",selected=null,drag=null,undo=null,stationKey=null;
  let bounds=sectionDrawBounds([],modelBounds);
  const read=()=>parseStructuralMembers(textInput.value);
  const stationOf=m=>String(m.x0)+"|"+String(m.x1);
  function station(){
    const value=stationSelect.value;
    if(value==="custom"||!value)return {x0:Number(x0.value),x1:Number(x1.value)};
    const [a,b]=value.split("|").map(Number);
    return {x0:a,x1:b};
  }
  function updateStations(members){
    const unique=[...new Set(members.map(stationOf))].sort((a,b)=>
      Number(a.split("|")[0])-Number(b.split("|")[0]));
    const old=stationKey;
    stationSelect.innerHTML=unique.map(key=>{
      const [a,b]=key.split("|");
      return '<option value="'+esc(key)+'">'+esc(a)+" to "+esc(b)+' m</option>';
    }).join("")+'<option value="custom">New interval (enter X start/end)</option>';
    stationKey=old&&unique.includes(old)?old:(old==="custom"?"custom":unique[0]||"custom");
    stationSelect.value=stationKey;
    if(stationKey!=="custom"){
      const [a,b]=stationKey.split("|");
      x0.value=a;x1.value=b;
    }else if(!x0.value&&!x1.value){
      x0.value=String(modelBounds?.min?.[0]??0);
      x1.value=String(modelBounds?.max?.[0]??10);
    }
  }
  function chosenMembers(members){
    return members.flatMap((m,index)=>stationOf(m)===stationKey?[{...m,index}]:[]);
  }
  function readAt(e){
    const box=svg.getBoundingClientRect();
    if(!box.width||!box.height)throw Error("Open the section sketch before drawing");
    const x=Math.max(0,Math.min(size.width,(e.clientX-box.left)/box.width*size.width));
    const y=Math.max(0,Math.min(size.height,(e.clientY-box.top)/box.height*size.height));
    return {x,y};
  }
  const xy=p=>sectionMetersToPixel(p[0],p[1],bounds,size);
  function selectedMember(members){
    return selected!==null?members[selected]||null:null;
  }
  function render(){
    if(disposed)return;
    let members;
    try{members=read()}catch(err){
      selected=null;details.hidden=true;
      warning.hidden=false;warning.textContent="Invalid CSV: "+err.message;
      live.textContent="Correct invalid member rows to restore section properties.";
      svg.innerHTML="";return;
    }
    updateStations(members);
    const subset=chosenMembers(members);
    bounds=sectionDrawBounds(subset,modelBounds);
    const overlap=structuralOverlapAudit(members);
    warning.hidden=overlap.passed;
    warning.textContent=overlap.passed?"":overlap.warnings[0].description+
      " Calculation is blocked until physical metal intersections are corrected.";
    let section=null;
    const localAudit=structuralOverlapAudit(subset);
    if(subset.length&&localAudit.passed){
      try{section=sectionProperties(subset)}
      catch(err){live.textContent="Section properties unavailable: "+err.message}
    }
    if(section){
      live.innerHTML=
        '<div><span>Elastic neutral axis Z</span><strong>'+
        section.zNeutral.toFixed(4)+' m</strong></div>'+
        '<div><span>Section bending stiffness EI</span><strong>'+
        section.EI.toExponential(4)+' N·m²</strong></div>'+
        '<div><span>Gross member mass per metre</span><strong>'+
        section.tonnesPerM.toFixed(4)+' t/m</strong></div>'+
        '<div><span>Gross structural cross-section area</span><strong>'+
        section.areaM2.toFixed(5)+' m²</strong></div>';
    }else if(!subset.length){
      live.textContent="Draw at least one member in this X station to preview its EI, elastic neutral axis and mass.";
    }else if(!localAudit.passed){
      live.textContent="Section preview blocked by overlapping structural members; correct the marked geometry first.";
    }
    const b=bounds;
    const grid=[];
    for(let j=1;j<5;j++){
      const x=j*size.width/5,y=j*size.height/5;
      grid.push('<path d="M'+round(x)+' 0V'+size.height+"M0 "+round(y)+"H"+size.width+
        '" stroke="currentColor" opacity=".1"/>');
    }
    const shapes=subset.map(m=>{
      const active=m.index===selected;
      if(m.kind==="plate"){
        const p=xy([m.y0,m.z0]),q=xy([m.y1,m.z1]);
        const w=Math.max(6,m.t*size.width/(b.y1-b.y0));
        return '<line data-section-member="'+m.index+'" x1="'+round(p.x)+
          '" y1="'+round(p.y)+'" x2="'+round(q.x)+'" y2="'+round(q.y)+
          '" stroke="var(--accent)" stroke-width="'+w.toFixed(2)+'" stroke-linecap="butt" '+
          (active?'opacity="1" stroke-dasharray="8 3"':'opacity=".78"')+'/>';
      }
      const tl=xy([m.y-m.width/2,m.z+m.height/2]);
      const br=xy([m.y+m.width/2,m.z-m.height/2]);
      return '<rect data-section-member="'+m.index+'" x="'+round(tl.x)+'" y="'+round(tl.y)+
        '" width="'+Math.max(2,br.x-tl.x).toFixed(2)+'" height="'+Math.max(2,br.y-tl.y).toFixed(2)+
        '" fill="var(--danger)" fill-opacity="'+(active?".95":".68")+
        '" stroke="var(--danger)" stroke-width="'+(active?3:1)+'"/>';
    }).join("");
    svg.innerHTML='<rect width="'+size.width+'" height="'+size.height+'" fill="var(--surface-sunk)"/>'+
      grid.join("")+shapes+
      (section?'<path data-section-neutral-axis d="M8 '+round(xy([0,section.zNeutral]).y)+
        'H632" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="6 4" pointer-events="none"/>':"")+
      '<rect x="1" y="1" width="638" height="338" fill="none" stroke="var(--line-strong)"/>'+
      '<text x="10" y="18" font-size="12" fill="var(--ink)">Z '+round(b.z1)+' m</text>'+
      '<text x="10" y="330" font-size="12" fill="var(--ink)">Z '+round(b.z0)+' m</text>'+
      '<text x="630" y="330" text-anchor="end" font-size="12" fill="var(--ink)">Y '+round(b.y1)+' m</text>'+
      '<text x="10" y="36" font-size="11" fill="var(--ink-2)">Y '+round(b.y0)+' m</text>'+
      '<g data-section-preview pointer-events="none"></g>';
    const current=selectedMember(members);
    if(!current||stationOf(current)!==stationKey){
      selected=null;details.hidden=true;
    }else{
      details.hidden=false;
      name.textContent=(current.kind==="plate"?"Plate":"Rectangular stiffener")+
        " · member "+(selected+1);
      const vals=current.kind==="plate"?[
        ["y0","Y0 (m)",current.y0],["z0","Z0 (m)",current.z0],
        ["y1","Y1 (m)",current.y1],["z1","Z1 (m)",current.z1],
        ["t","Thickness (m)",current.t]
      ]:[
        ["y","Y center (m)",current.y],["z","Z center (m)",current.z],
        ["width","Width Y (m)",current.width],["height","Height Z (m)",current.height]
      ];
      vals.push(["E","Material E (GPa)",current.E/1e9],["rho","Density (kg/m³)",current.rho]);
      fields.innerHTML=vals.map(([key,label,value])=>
        '<label>'+label+' <input data-section-prop="'+key+
          '" type="number" step="any" value="'+value+'"></label>').join("");
    }
    undoButton.disabled=!undo;
  }
  function save(next,message){
    if(next===textInput.value)return;
    const previous=textInput.value;
    parseStructuralMembers(next);
    undo={previous,next};
    textInput.value=next;
    textInput.dispatchEvent(new Event("input",{bubbles:true}));
    status.textContent=message+" Recalculate to update EI, stress and mass.";
  }
  function select(index){
    const members=read();
    if(!members[index])throw Error("Selected member no longer exists");
    selected=index;
    mode="select";
    host.querySelectorAll("[data-section-mode]").forEach(button=>
      button.setAttribute("aria-pressed",String(button.dataset.sectionMode==="select")));
    render();
    status.textContent="Member "+(index+1)+" selected; drag to move or edit its numeric dimensions.";
  }
  function onMode(event){
    if(event.target.closest("[data-section-undo]")){
      if(!undo)return;
      if(textInput.value!==undo.next){
        status.textContent="Cannot undo; the CSV was edited since this sketch action.";
        undo=null;render();return;
      }
      const previous=undo.previous;undo=null;selected=null;
      textInput.value=previous;textInput.dispatchEvent(new Event("input",{bubbles:true}));
      status.textContent="The last visual edit was undone.";return;
    }
    const button=event.target.closest("[data-section-mode]");
    if(!button)return;
    mode=button.dataset.sectionMode;selected=null;drag=null;
    host.querySelectorAll("[data-section-mode]").forEach(b=>
      b.setAttribute("aria-pressed",String(b.dataset.sectionMode===mode)));
    render();
    status.textContent=mode==="select"?"Choose a member, then drag to move or edit dimensions.":
      mode==="plate"?"Drag from one endpoint to another in the Y/Z plane.":
      "Click to place a rectangular stiffener with the chosen width/height.";
  }
  function onStation(){
    stationKey=stationSelect.value;selected=null;
    if(stationKey!=="custom"){
      const [a,b]=stationKey.split("|");
      x0.value=a;x1.value=b;
    }
    render();
    status.textContent=stationKey==="custom"?"Enter the start and end X for a new station.":
      "Showing section "+stationKey.replace("|"," → ")+" m.";
  }
  function onPointerDown(e){
    if(e.button!==0)return;
    try{
      const start=readAt(e);
      if(mode==="select"){
        const shape=e.target.closest("[data-section-member]");
        if(!shape){selected=null;render();return}
        const index=Number(shape.dataset.sectionMember);
        select(index);
        drag={start,index,kind:"move",original:read()[index],source:textInput.value};
      }else drag={start,kind:mode,source:textInput.value};
      svg.setPointerCapture?.(e.pointerId);
    }catch(err){drag=null;status.textContent=err.message}
  }
  function onPointerMove(e){
    if(!drag)return;
    try{
      const end=readAt(e);
      const preview=svg.querySelector("[data-section-preview]");
      if(!preview)return;
      if(drag.kind==="plate"){
        preview.innerHTML='<line x1="'+round(drag.start.x)+'" y1="'+round(drag.start.y)+
          '" x2="'+round(end.x)+'" y2="'+round(end.y)+
          '" stroke="var(--accent)" stroke-dasharray="6 4" stroke-width="6"/>';
      }else if(drag.kind==="move"){
        const a=sectionPixelToMeters(drag.start,bounds,size);
        const b=sectionPixelToMeters(end,bounds,size);
        const m=translateSectionMember(drag.original,b.y-a.y,b.z-a.z);
        if(m.kind==="plate"){
          const p=xy([m.y0,m.z0]),q=xy([m.y1,m.z1]);
          preview.innerHTML='<line x1="'+round(p.x)+'" y1="'+round(p.y)+
            '" x2="'+round(q.x)+'" y2="'+round(q.y)+
            '" stroke="var(--accent)" stroke-dasharray="5 4" stroke-width="4"/>';
        }else{
          const p=xy([m.y,m.z]);
          preview.innerHTML='<circle cx="'+round(p.x)+'" cy="'+round(p.y)+
            '" r="10" fill="none" stroke="var(--danger)" stroke-width="3"/>';
        }
      }
    }catch(err){status.textContent=err.message}
  }
  function onPointerUp(e){
    if(!drag)return;
    const d=drag;drag=null;
    try{
      const end=readAt(e),dist=Math.hypot(end.x-d.start.x,end.y-d.start.y);
      if(d.source!==textInput.value)throw Error("CSV changed during drawing; retry");
      if(d.kind==="move"){
        if(dist<3){render();return}
        const a=sectionPixelToMeters(d.start,bounds,size),
          b=sectionPixelToMeters(end,bounds,size);
        save(updateSectionRow(textInput.value,d.index,
          translateSectionMember(d.original,b.y-a.y,b.z-a.z)),
          "Moved member "+(d.index+1)+" on its existing longitudinal station.");
      }else{
        const xStart=Number(x0.value),xEnd=Number(x1.value);
        if(!finite(xStart)||!finite(xEnd)||!(xEnd>xStart))
          throw Error("Enter valid X start/end for the selected station");
        const value=name=>{
          const element={thickness,memberWidth,memberHeight,E,rho}[name];
          if(!element.value.trim()||!(Number(element.value)>0))
            throw Error("Thickness, stiffener size, E and density must be positive");
          return Number(element.value);
        };
        let member;
        if(d.kind==="plate"){
          if(dist<5)throw Error("Drag a longer plate segment between two Y/Z points");
          const a=sectionPixelToMeters(d.start,bounds,size),
            b=sectionPixelToMeters(end,bounds,size);
          member={kind:"plate",x0:xStart,x1:xEnd,y0:a.y,z0:a.z,y1:b.y,z1:b.z,
            t:value("thickness"),E:value("E")*1e9,rho:value("rho")};
        }else{
          const a=sectionPixelToMeters(end,bounds,size);
          member={kind:"stiffener",x0:xStart,x1:xEnd,y:a.y,z:a.z,
            width:value("memberWidth"),height:value("memberHeight"),
            E:value("E")*1e9,rho:value("rho")};
        }
        save(insertSectionMember(textInput.value,member),
          "Added "+member.kind+" on X "+xStart+" to "+xEnd+" m.");
        stationKey=stationOf(member);
      }
    }catch(err){status.textContent="Unchanged: "+err.message}
    render();
  }
  function onSelection(e){
    if(e.target.closest("[data-section-clear]")){
      selected=null;render();return;
    }
    const deleting=e.target.closest("[data-section-delete]");
    const updating=e.target.closest("[data-section-update]");
    if(!deleting&&!updating||selected===null)return;
    try{
      const member=read()[selected];
      if(!member)throw Error("Member no longer exists");
      if(deleting){
        save(updateSectionRow(textInput.value,selected,null),"Removed member "+(selected+1));
        selected=null;
      }else{
        const edited={...member};
        for(const input of fields.querySelectorAll("[data-section-prop]")){
          if(!input.value.trim()||!finite(Number(input.value)))
            throw Error("Every member property requires a finite numeric value");
          const name=input.dataset.sectionProp;
          edited[name]=name==="E"?Number(input.value)*1e9:Number(input.value);
        }
        save(updateSectionRow(textInput.value,selected,edited),
          "Updated member "+(selected+1)+" dimensions and material");
      }
    }catch(err){status.textContent="Unchanged: "+err.message}
    render();
  }
  function onInput(){render()}
  function onCancel(){drag=null;render()}
  toolbar.addEventListener("click",onMode);
  stationSelect.addEventListener("change",onStation);
  details.addEventListener("click",onSelection);
  svg.addEventListener("pointerdown",onPointerDown);
  svg.addEventListener("pointermove",onPointerMove);
  svg.addEventListener("pointerup",onPointerUp);
  svg.addEventListener("pointercancel",onCancel);
  textInput.addEventListener("input",onInput);
  render();
  return ()=>{
    disposed=true;
    toolbar.removeEventListener("click",onMode);
    stationSelect.removeEventListener("change",onStation);
    details.removeEventListener("click",onSelection);
    svg.removeEventListener("pointerdown",onPointerDown);
    svg.removeEventListener("pointermove",onPointerMove);
    svg.removeEventListener("pointerup",onPointerUp);
    svg.removeEventListener("pointercancel",onCancel);
    textInput.removeEventListener("input",onInput);
  };
}
