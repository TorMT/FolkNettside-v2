import {parse3MF} from "../../model/parsers/three-mf.js?v=ac814c72d15c6b6265a1c02b43bc1ac19d96fe4c";
import {renderModelWorkbench} from "../model-workbench.js?v=ac814c72d15c6b6265a1c02b43bc1ac19d96fe4c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
