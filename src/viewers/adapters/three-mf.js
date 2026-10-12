import {parse3MF} from "../../model/parsers/three-mf.js?v=90f5115b462587fcc181c99a266af1e4c6f8e905";
import {renderModelWorkbench} from "../model-workbench.js?v=90f5115b462587fcc181c99a266af1e4c6f8e905";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
