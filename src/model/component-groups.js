/** UI-only groups: source CAD hierarchy remains unchanged.
 * "Thruster fremre" and "Thruster bakre" have a shared default group.
 * Explicit overrides never change source component metadata.
 */
const POSITION=/^(?:front|forward|fore|fwd|aft|after|rear|back|stern|bow|fremre|bakre|foran|akter|akterut|port|starboard|babord|styrbord|left|right|venstre|høyre|hoeyre|bb|sb|no\.?\s*\d+|\d+|\#\d+)$/i;
export function suggestedComponentGroup(name=""){
 const cleaned=String(name).replace(/[_-]+/g," ").trim().replace(/\s+/g," ");
 if(!cleaned)return "Unassigned";
 const words=cleaned.split(" ");
 while(words.length>1&&POSITION.test(words.at(-1)))words.pop();
 while(words.length>1&&POSITION.test(words[0]))words.shift();
 return words.join(" ")||cleaned;
}
export function componentGroups(model,overrides={}){
 const groups=new Map();
 for(const component of model?.components||[]){
   if(!component.geometry)continue;
   const specified=overrides[component.id]??component.metadata?.viewerGroup??null;
   const name=String(specified||suggestedComponentGroup(component.name)).trim().slice(0,100)||"Unassigned";
   if(!groups.has(name))groups.set(name,[]);
   groups.get(name).push({id:component.id,name:component.name});
 }
 return [...groups].map(([name,components])=>({name,components}));
}
export function groupMemberIds(model,group,overrides={}){
 return componentGroups(model,overrides).find(item=>item.name===group)?.components.map(item=>item.id)||[];
}
