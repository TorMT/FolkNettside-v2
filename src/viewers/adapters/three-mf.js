import {parse3MF} from "../../model/parsers/three-mf.js?v=f29ecd276d5a523b71c4fea00546b45e61850a7f";
import {renderModelWorkbench} from "../model-workbench.js?v=f29ecd276d5a523b71c4fea00546b45e61850a7f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
