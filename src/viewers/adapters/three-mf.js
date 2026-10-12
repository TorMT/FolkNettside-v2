import {parse3MF} from "../../model/parsers/three-mf.js?v=c069d06605336ec6b20a55d0b13a48d9b985e62a";
import {renderModelWorkbench} from "../model-workbench.js?v=c069d06605336ec6b20a55d0b13a48d9b985e62a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
