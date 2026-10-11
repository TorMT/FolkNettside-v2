import {parse3MF} from "../../model/parsers/three-mf.js?v=8e0c15571814ec770413057e733c1fddcf4e4d02";
import {renderModelWorkbench} from "../model-workbench.js?v=8e0c15571814ec770413057e733c1fddcf4e4d02";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
