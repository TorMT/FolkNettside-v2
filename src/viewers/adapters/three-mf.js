import {parse3MF} from "../../model/parsers/three-mf.js?v=b5455b32738e9b17ad310c9ce9a2116db0c3c501";
import {renderModelWorkbench} from "../model-workbench.js?v=b5455b32738e9b17ad310c9ce9a2116db0c3c501";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
