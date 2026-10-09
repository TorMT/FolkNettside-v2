import {componentGroupTree} from "../model/component-groups.js";
import {identifiedThrusterIntakes,manualThrusterAtComponent,modelThrusterCandidates} from "../model/thruster-intake.js";

const AXES=[
 ["1,0,0","+X"],["-1,0,0","−X"],["0,1,0","+Y"],["0,-1,0","−Y"],["0,0,1","+Z"],["0,0,-1","−Z"]
];
function elem(tag,cls,text){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(text!==undefined)node.textContent=text;
 return node;
}
function button(text,handler,cls="btn"){
 const node=elem("button",cls,text);node.type="button";
 node.addEventListener("click",handler);return node;
}
/** UI-only hierarchy and per-part inspection for any source CAD format.
 * The original ModelDocument is neither modified nor replaced by this UI.
 */
export function mountAssemblyInspector(host,model,scene,{updateWaterline=()=>{}}={}){
 const overrides={},selected=new Set(),manualFlow=new Map();
 let solo=false,playing=false;
 host.innerHTML='<section class="assembly-inspector">'+
   '<h3>Components and groups</h3>'+
   '<p class="muted">Shared names are grouped automatically (e.g. Skrog → Fremre/Bakre, Thruster → Fremre/Bakre). Open groups to select individual parts.</p>'+
   '<div data-cad-group-tree class="cad-group-tree" role="tree" aria-label="CAD component hierarchy"></div>'+
   '<p data-cad-selected class="muted" aria-live="polite">Select a group or component</p>'+
   '<div class="model-viewer-actions cad-group-actions">'+
     '<button type="button" data-cad-focus>Focus selected</button>'+
     '<button type="button" data-cad-solo>Isolate selected</button>'+
     '<button type="button" data-cad-show>Show all</button>'+
   '</div>'+
   '<label class="model-viewer-label">Explode selected group/component (visual only)'+
     '<input data-cad-group-explode type="range" min="0" max="3" step=".05" value="0"></label>'+
   '<label class="model-viewer-label">Group path (e.g. Skrog / Fremre)'+
     '<input type="text" data-cad-group-path maxlength="140" placeholder="Thruster / Fremre"></label>'+
   '<button type="button" data-cad-assign class="btn">Assign selected to group</button>'+
   '<p class="muted">Manual grouping changes only this visual session, never the source CAD file.</p>'+
   '</section><section class="assembly-inspector">'+
   '<h3>Thruster intake direction</h3>'+
   '<p class="muted">Select a thruster component or group. Rings flow toward the intake, then the arrow points through the propeller and out. This is directional illustration, not CFD.</p>'+
   '<label class="model-viewer-label">Thrust axis'+
     '<select data-cad-thrust-axis></select></label>'+
   '<label class="model-viewer-label">Propeller disk diameter (m)'+
     '<input data-cad-thrust-dia type="number" value="1" min=".01" max="200" step=".1"></label>'+
   '<div class="model-viewer-actions">'+
     '<button type="button" data-cad-thrust-mark>Mark selected as thruster(s)</button>'+
     '<button type="button" data-cad-thrust-play>Play intake rings</button>'+
     '<button type="button" data-cad-thrust-clear>Clear markers</button>'+
   '</div><p data-cad-thrust-status role="status" aria-live="polite">Select component(s) to mark.</p>'+
   '</section>';
 const $=selector=>host.querySelector(selector);
 const tree=$("[data-cad-group-tree]"),summary=$("[data-cad-selected]");
 const status=$("[data-cad-thrust-status]");
 const selectAxis=$("[data-cad-thrust-axis]");
 for(const [value,label] of AXES){
   const opt=elem("option",null,label);opt.value=value;selectAxis.append(opt);
 }
 const candidates=new Set(modelThrusterCandidates(model).map(c=>c.id));
 const synced=identifiedThrusterIntakes(model);
 function syncFlow(){
   const descriptors=new Map(synced.map(item=>[item.id,item]));
   for(const item of manualFlow.values())descriptors.set(item.id,item);
   const count=scene.actions.setThrusterFlows([...descriptors.values()]);
   scene.actions.playThrusterFlows(playing);
   status.textContent=count+" thruster intake marker(s) · arrows show assumed water direction.";
 }
 function choose(ids,label,{componentId=null}={}){
   selected.clear();
   for(const id of ids)selected.add(id);
   summary.textContent=label+" · "+selected.size+" component(s)";
   $("[data-cad-group-explode]").value="0";
   scene.actions.setScopedExplode({ids:[],amount:0});
   if(componentId)scene.selectById(componentId);
   tree.querySelectorAll("[aria-selected]").forEach(node=>
     node.setAttribute("aria-selected",String(node.dataset.groupSelect===label)));
   $("[data-cad-group-path]").value="";
 }
 function renderTree(){
   tree.replaceChildren();
   const assembly=componentGroupTree(model,overrides);
   const renderLeaf=(item,parent)=>{
     const key=elem("button","cad-component-leaf","◦  "+item.name);
     key.type="button";key.dataset.groupSelect=item.name;
     key.setAttribute("role","treeitem");key.setAttribute("aria-selected","false");
     key.addEventListener("click",()=>choose([item.id],item.name,{componentId:item.id}));
     parent.append(key);
   };
   const renderGroup=(group,parent)=>{
     const details=elem("details","cad-group-node");
     details.open=group.path.split("/").length<2;
     const head=elem("summary","cad-group-header");
     const label=button("▣ "+group.name+" ("+group.ids.length+")",event=>{
       event.stopPropagation();choose(group.ids,group.path);
     },"cad-group-select");
     label.dataset.groupSelect=group.path;
     label.setAttribute("role","treeitem");label.setAttribute("aria-selected","false");
     head.append(label);details.append(head);
     const children=elem("div","cad-group-children");
     for(const sub of group.groups)renderGroup(sub,children);
     for(const component of group.components)renderLeaf(component,children);
     details.append(children);parent.append(details);
   };
   for(const group of assembly.groups)renderGroup(group,tree);
   for(const component of assembly.components)renderLeaf(component,tree);
   if(!assembly.total)tree.append(elem("p","muted","No mesh components were found in this CAD document."));
 }
 function resetScene(){
   solo=false;scene.actions.setIsolation(null);
   scene.actions.setScopedExplode({ids:[],amount:0});
   $("[data-cad-group-explode]").value="0";
   selected.clear();
   summary.textContent="All components visible";
   updateWaterline();
 }
 renderTree();
 $("[data-cad-focus]").addEventListener("click",()=>{
   if(selected.size)scene.actions.focusComponents([...selected]);
 });
 $("[data-cad-solo]").addEventListener("click",()=>{
   if(!selected.size){summary.textContent="Select a part or group first";return}
   solo=true;scene.actions.setIsolation([...selected]);
   scene.actions.focusComponents([...selected]);updateWaterline();
 });
 $("[data-cad-show]").addEventListener("click",resetScene);
 $("[data-cad-group-explode]").addEventListener("input",event=>{
   scene.actions.setScopedExplode({ids:[...selected],amount:Number(event.currentTarget.value)});
   updateWaterline();
 });
 $("[data-cad-assign]").addEventListener("click",()=>{
   const path=$("[data-cad-group-path]").value.trim();
   if(!selected.size||!path){summary.textContent="Select CAD parts and enter a group path";return}
   for(const id of selected)overrides[id]=path;
   renderTree();summary.textContent=selected.size+" component(s) assigned to "+path;
 });
 $("[data-cad-thrust-mark]").addEventListener("click",()=>{
   if(!selected.size){status.textContent="Select a group or part first";return}
   const axis=selectAxis.value.split(",").map(Number);
   const diameter=Number($("[data-cad-thrust-dia]").value);
   if(!(diameter>0&&diameter<=200)){status.textContent="Enter valid propeller diameter in metres";return}
   let count=0;
   for(const id of selected){
     try{
       manualFlow.set(id,manualThrusterAtComponent(model,id,{thrustAxis:axis,diameter}));
       count++;
     }catch(error){status.textContent=String(error.message||error)}
   }
   syncFlow();
   status.textContent=count+" selected "+(count===1?"part":"parts")+" marked · original CAD unchanged.";
 });
 $("[data-cad-thrust-play]").addEventListener("click",event=>{
   playing=!playing;
   const actual=scene.actions.playThrusterFlows(playing);
   playing=actual;
   event.currentTarget.textContent=playing?"Pause intake rings":"Play intake rings";
 });
 $("[data-cad-thrust-clear]").addEventListener("click",()=>{
   manualFlow.clear();playing=false;
   scene.actions.playThrusterFlows(false);
   $("[data-cad-thrust-play]").textContent="Play intake rings";
   scene.actions.setThrusterFlows([]);
   status.textContent="Manual thruster markers cleared.";
 });
 // Metadata is used only when the source defines an unambiguous orientation.
 if(synced.length)syncFlow();
 return {
   get selectedIds(){return [...selected]},
   get groupPaths(){return componentGroupTree(model,overrides)},
   dispose(){
     playing=false;scene.actions.playThrusterFlows(false);
     scene.actions.setThrusterFlows([]);
     host.replaceChildren();
   }
 };
}
