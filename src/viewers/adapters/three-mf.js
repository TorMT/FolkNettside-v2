import {parse3MF} from "../../model/parsers/three-mf.js?v=835f14065a80706db17c31268d9d98db95531cc8";
import {renderModelWorkbench} from "../model-workbench.js?v=835f14065a80706db17c31268d9d98db95531cc8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
