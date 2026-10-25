import {parse3MF} from "../../model/parsers/three-mf.js?v=3f2b7644d1b7d4bdefd3c49a1dbc9d1aaed4801d";
import {renderModelWorkbench} from "../model-workbench.js?v=3f2b7644d1b7d4bdefd3c49a1dbc9d1aaed4801d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
