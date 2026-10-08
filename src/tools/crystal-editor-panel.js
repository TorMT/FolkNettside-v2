import {MANUAL_ATOMS} from "./crystal-analysis.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d";

function option(value,label,current){
  return "<option value=\""+value+"\""+(String(value)===String(current)?" selected":"")+">"+label+"</option>";
}

export function crystalEditorPanelHTML(state={}){
  const visibility=state.visibility||"both";
  const editMode=state.editMode||"none";
  const manualAtom=state.manualAtom||"fe";
  const planeFamily=state.planeFamily||"none";
  const atom=MANUAL_ATOMS[manualAtom]||MANUAL_ATOMS.custom;
  const modes=[
    ["none","None / rotate"],["dopant","Dopant substitution"],["vacancy","Vacancy"],
    ["interstitial","Interstitial atom"],["electron","Electron marker"],["hole","Hole marker"],["manual","Manual atom"]
  ];
  return '<div class="crystal-subpanel"><strong>Visibility & bonds</strong>'+
    '<label class="field"><span>Visibility</span><select id="crystal-visibility">'+
      option("both","Atoms + holes",visibility)+option("atoms","Atoms only",visibility)+option("holes","Holes only",visibility)+
    '</select></label>'+
    '<button class="btn '+(state.showBonds?"primary":"")+'" id="crystal-bonds">Bonds</button>'+
  '</div>'+
  '<div class="crystal-subpanel"><strong>Defects & manual atoms</strong>'+
    '<label class="field"><span>Edit mode</span><select id="crystal-edit-mode">'+modes.map(function(item){return option(item[0],item[1],editMode)}).join("")+'</select></label>'+
    '<label class="field"><span>Atom type</span><select id="crystal-manual-atom">'+Object.entries(MANUAL_ATOMS).map(function(entry){return option(entry[0],entry[1].label,manualAtom)}).join("")+'</select></label>'+
    '<div class="crystal-coordinate-grid">'+
      '<label><span>X</span><input id="crystal-x" type="number" step="0.05" value="'+Number(state.placeX??.5)+'"></label>'+
      '<label><span>Y</span><input id="crystal-y" type="number" step="0.05" value="'+Number(state.placeY??.5)+'"></label>'+
      '<label><span>Z</span><input id="crystal-z" type="number" step="0.05" value="'+Number(state.placeZ??.5)+'"></label>'+
    '</div>'+
    '<label class="field"><span>Manual radius</span><input id="crystal-radius" type="number" min="0.02" step="0.01" value="'+Number(state.manualRadius||atom.radius)+'"></label>'+
    '<label class="field"><span>Manual color</span><input id="crystal-color" type="color" value="'+(state.manualColor||atom.color)+'"></label>'+
    '<div class="crystal-toggle-grid"><button class="btn primary" id="crystal-add-edit">Apply / place</button><button class="btn" id="crystal-undo-edit">Undo edit</button><button class="btn" id="crystal-clear-edits">Clear edits</button></div>'+
    '<p class="muted hydro-note">Vacancy/dopant can also be applied by clicking an atom. Position-based edits use X/Y/Z.</p>'+
  '</div>'+
  '<div class="crystal-subpanel"><strong>Planes & analysis</strong>'+
    '<label class="field"><span>Plane family</span><select id="crystal-plane-family">'+option("none","None",planeFamily)+option("close","Close-packed family",planeFamily)+option("miller","Custom Miller (h k l)",planeFamily)+'</select></label>'+
    '<div class="crystal-coordinate-grid">'+
      '<label><span>h</span><input id="crystal-h" type="number" step="1" value="'+Number(state.h??1)+'"></label>'+
      '<label><span>k</span><input id="crystal-k" type="number" step="1" value="'+Number(state.k??0)+'"></label>'+
      '<label><span>l</span><input id="crystal-l" type="number" step="1" value="'+Number(state.l??0)+'"></label>'+
    '</div>'+
    '<button class="btn" id="crystal-reset-view">Reset view</button>'+
    '<div id="crystal-analysis" class="crystal-analysis"></div>'+
  '</div>';
}

export function readCrystalEditorState(root,state={}){
  return {
    ...state,
    visibility:root.querySelector("#crystal-visibility")?.value||"both",
    editMode:root.querySelector("#crystal-edit-mode")?.value||"none",
    manualAtom:root.querySelector("#crystal-manual-atom")?.value||"fe",
    placeX:Number(root.querySelector("#crystal-x")?.value)||0,
    placeY:Number(root.querySelector("#crystal-y")?.value)||0,
    placeZ:Number(root.querySelector("#crystal-z")?.value)||0,
    manualRadius:Number(root.querySelector("#crystal-radius")?.value)||.12,
    manualColor:root.querySelector("#crystal-color")?.value||"#b3157a",
    planeFamily:root.querySelector("#crystal-plane-family")?.value||"none",
    h:Number(root.querySelector("#crystal-h")?.value)||0,
    k:Number(root.querySelector("#crystal-k")?.value)||0,
    l:Number(root.querySelector("#crystal-l")?.value)||0
  };
}

export function editFromState(state,baseIndex=null){
  const mode=state.editMode||"none";
  if(mode==="none")return null;
  const target=[Number(state.placeX)||0,Number(state.placeY)||0,Number(state.placeZ)||0];
  const maxDistance=Math.max(.05,.35*(Number(state.a)||1));
  if(mode==="vacancy")return {type:"vacancy",baseIndex,target,maxDistance};
  if(mode==="dopant"){
    const atom=MANUAL_ATOMS[state.manualAtom]||MANUAL_ATOMS.custom;
    return {type:"dopant",baseIndex,target,maxDistance,species:atom.species};
  }
  const atom=MANUAL_ATOMS[state.manualAtom]||MANUAL_ATOMS.custom;
  const pos=target;
  if(mode==="electron"||mode==="hole")return {type:mode,pos};
  if(mode==="manual"||mode==="interstitial")return {type:mode,pos,atomType:state.manualAtom,species:atom.species,radius:Number(state.manualRadius)||atom.radius,color:state.manualColor||atom.color};
  return null;
}