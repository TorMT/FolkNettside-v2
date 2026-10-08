import {parse3MF} from "../../model/parsers/three-mf.js?v=5bf1d0032fb32a86a08e59c2518c330e59de38a2";
import {renderModelWorkbench} from "../model-workbench.js?v=5bf1d0032fb32a86a08e59c2518c330e59de38a2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
