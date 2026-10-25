import {parseKisssoftBuffer} from "../../engineering/kisssoft-core.js?v=c241949aa9e43c038d70642e616c579b97de2f48";
import {kisssoftSummary,mountKisssoftVisual,bindKisssoftParameterSearch} from "../../engineering/kisssoft-tool.js?v=c241949aa9e43c038d70642e616c579b97de2f48";
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
