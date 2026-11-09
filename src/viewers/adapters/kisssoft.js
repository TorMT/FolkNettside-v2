import {parseKisssoftBuffer} from "../../engineering/kisssoft-core.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";
import {fetchBoundedBuffer,previewContentURL} from "../utils.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";
import {publicKisssoftRelayURL} from "../ntnu-kisssoft-proxy.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";
import {kisssoftSummary,mountKisssoftVisual,bindKisssoftParameterSearch} from "../../engineering/kisssoft-tool.js?v=f184f9a61104f9a9f1796528e12d901dd70fec6b";
export async function render(container,resource){
 // NTNU original stays in resource.url; an explicitly selected local
 // copy lives at resource.path and must take precedence for preview bytes.
 const source=previewContentURL(resource);
 const relay=publicKisssoftRelayURL(resource);
 const data=await fetchBoundedBuffer(relay||source,{maxBytes:12_000_000});
 const model=parseKisssoftBuffer(data,resource.name||source);
 container.innerHTML=kisssoftSummary(model);
 bindKisssoftParameterSearch(container,model);
 const cleanup=await mountKisssoftVisual(container,model);
 return {info:model.format+" · "+model.moduleCode+" · imported parameter preview",cleanup};
}
