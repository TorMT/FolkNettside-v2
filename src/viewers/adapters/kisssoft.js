import {parseKisssoftBuffer} from "../../engineering/kisssoft-core.js?v=4bd96e34e1aafda4cdf2564b222565c1d724d8f7";
import {fetchBoundedBuffer,previewContentURL} from "../utils.js?v=4bd96e34e1aafda4cdf2564b222565c1d724d8f7";
import {kisssoftSummary,mountKisssoftVisual,bindKisssoftParameterSearch} from "../../engineering/kisssoft-tool.js?v=4bd96e34e1aafda4cdf2564b222565c1d724d8f7";
export async function render(container,resource){
 // NTNU original stays in resource.url; an explicitly selected local
 // copy lives at resource.path and must take precedence for preview bytes.
 const source=previewContentURL(resource);
 const data=await fetchBoundedBuffer(source,{maxBytes:12_000_000});
 const model=parseKisssoftBuffer(data,resource.name||source);
 container.innerHTML=kisssoftSummary(model);
 bindKisssoftParameterSearch(container,model);
 const cleanup=await mountKisssoftVisual(container,model);
 return {info:model.format+" · "+model.moduleCode+" · imported parameter preview",cleanup};
}
