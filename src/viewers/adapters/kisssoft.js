import {parseKisssoftBuffer} from "../../engineering/kisssoft-core.js?v=560d3200150b5bae6b37be7c40d161b2f3a0d34f";
import {kisssoftSummary,mountKisssoftVisual,bindKisssoftParameterSearch} from "../../engineering/kisssoft-tool.js?v=560d3200150b5bae6b37be7c40d161b2f3a0d34f";
export async function render(container,resource){
 const path=resource.url||resource.path;
 const response=await fetch(path);
 if(!response.ok)throw Error("KISSsoft import failed: HTTP "+response.status);
 const size=Number(response.headers.get("content-length")||0);
 if(size>12_000_000)throw Error("KISSsoft file exceeds safe viewer limit");
 const data=await response.arrayBuffer();
 const model=parseKisssoftBuffer(data,resource.name||path);
 container.innerHTML=kisssoftSummary(model);
 bindKisssoftParameterSearch(container,model);
 const cleanup=await mountKisssoftVisual(container,model);
 return {info:model.format+" · "+model.moduleCode+" · imported parameter preview",cleanup};
}
