import {parse3MF} from "../../model/parsers/three-mf.js?v=ccb01e36b0dd56a31421fd58f7574cc2834b2148";
import {renderModelWorkbench} from "../model-workbench.js?v=ccb01e36b0dd56a31421fd58f7574cc2834b2148";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
