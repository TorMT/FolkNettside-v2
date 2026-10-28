import {parse3MF} from "../../model/parsers/three-mf.js?v=62932505e0a98b797eaaa5840646cc0fc7ae8a1a";
import {renderModelWorkbench} from "../model-workbench.js?v=62932505e0a98b797eaaa5840646cc0fc7ae8a1a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
