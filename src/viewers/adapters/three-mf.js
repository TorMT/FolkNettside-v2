import {parse3MF} from "../../model/parsers/three-mf.js?v=224fc828bc29832a8d2b6b78fb53b91766b61609";
import {renderModelWorkbench} from "../model-workbench.js?v=224fc828bc29832a8d2b6b78fb53b91766b61609";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
