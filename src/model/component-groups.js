/** Presentation-only hierarchical groups. CAD component IDs/hierarchy are immutable.
 * Shared name prefixes form nested folders; direction words are normalized.
 */
const DIRECTIONS={
 fremre:"Fremre",foran:"Fremre",front:"Fremre",forward:"Fremre",fore:"Fremre",fwd:"Fremre",bow:"Fremre",
 bakre:"Bakre",akter:"Bakre",akterut:"Bakre",aft:"Bakre",after:"Bakre",rear:"Bakre",back:"Bakre",stern:"Bakre",
 babord:"Babord",port:"Babord",bb:"Babord",venstre:"Babord",left:"Babord",
 styrbord:"Styrbord",starboard:"Styrbord",sb:"Styrbord",høyre:"Styrbord",hoeyre:"Styrbord",right:"Styrbord",
 øvre:"Øvre",upper:"Øvre",top:"Øvre",nedre:"Nedre",lower:"Nedre",bottom:"Nedre"
};
function words(name){
 return String(name||"").replace(/([a-zæøå])([A-ZÆØÅ])/g,"$1 $2")
   .replace(/[_.,-]+/g," ").trim().split(/\s+/).filter(Boolean).slice(0,20);
}
const title=value=>String(value).replace(/^./u,c=>c.toUpperCase());
export function suggestedGroupPath(name=""){
 const tokens=words(name);
 if(!tokens.length)return ["Unassigned"];
 const spatial=[],ordinary=[];
 for(const word of tokens){
   const direction=DIRECTIONS[word.toLowerCase()];
   if(direction){if(!spatial.includes(direction))spatial.push(direction)}
   else if(!/^(?:#?\d+|no\d+)$/i.test(word))ordinary.push(title(word));
 }
 // Root is the equipment family ("Skrog", "Thruster", "Motor"); the
 // next levels represent the shared location and subtype, if any.
 if(!ordinary.length)return [spatial[0]||"Unassigned",...spatial.slice(1)];
 return [ordinary[0],...spatial,...ordinary.slice(1)];
}
export function suggestedComponentGroup(name=""){
 return suggestedGroupPath(name)[0];
}
export function componentGroupPath(component,overrides={}){
 const manual=overrides[component.id]??component.metadata?.viewerGroup;
 if(manual!==undefined&&manual!==null){
   const path=String(manual).split(/\s*[/›>]\s*/).map(v=>v.trim().slice(0,80)).filter(Boolean);
   if(path.length)return path.slice(0,12);
 }
 return suggestedGroupPath(component.name);
}
export function componentGroupTree(model,overrides={}){
 const root={name:"",path:"",children:new Map(),members:[],explicit:false};
 const components=(model?.components||[]).filter(c=>c.geometry);
 for(const component of components){
   const manual=overrides[component.id]??component.metadata?.viewerGroup;
   const path=componentGroupPath(component,overrides);
   let node=root;
   for(const part of path){
     const key=part.toLocaleLowerCase();
     if(!node.children.has(key))
       node.children.set(key,{name:part,path:node.path?node.path+" / "+part:part,
         children:new Map(),members:[],explicit:false});
     node=node.children.get(key);
     if(manual!==undefined&&manual!==null)node.explicit=true;
   }
   node.members.push({id:component.id,name:component.name});
 }
 const assemble=node=>{
   const nested=[...node.children.values()].map(assemble);
   const members=[...node.members,...nested.flatMap(child=>child.allComponents)];
   const groups=[],local=[...node.members];
   for(const child of nested){
     if(child.allComponents.length>=2||child.explicit)groups.push(child);
     else local.push(...child.allComponents);
   }
   return {name:node.name,path:node.path,groups,components:local,
     allComponents:members,ids:members.map(item=>item.id),
     explicit:node.explicit};
 };
 const top=assemble(root);
 return {groups:top.groups,components:top.components,allComponents:top.allComponents,
   total:components.length};
}
export function componentGroups(model,overrides={}){
 return componentGroupTree(model,overrides).groups.map(node=>({
   name:node.name,path:node.path,components:node.allComponents,children:node.groups
 }));
}
export function groupMemberIds(model,group,overrides={}){
 const find=nodes=>{
   for(const node of nodes){
     if(node.path===group||node.name===group)return node.ids;
     const match=find(node.groups);if(match)return match;
   }
   return null;
 };
 return find(componentGroupTree(model,overrides).groups)||[];
}
