import {parseKisssoftBuffer} from "../../engineering/kisssoft-core.js?v=469b5cda80fe77c01ec0885ac97a54188e276d5f";
import {fetchBoundedBuffer,previewContentURL} from "../utils.js?v=469b5cda80fe77c01ec0885ac97a54188e276d5f";
import {publicKisssoftRelayURL} from "../ntnu-kisssoft-proxy.js?v=469b5cda80fe77c01ec0885ac97a54188e276d5f";
import {kisssoftSummary,mountKisssoftVisual,bindKisssoftParameterSearch} from "../../engineering/kisssoft-tool.js?v=469b5cda80fe77c01ec0885ac97a54188e276d5f";
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
