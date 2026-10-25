import {parse3MF} from "../../model/parsers/three-mf.js?v=f156da35e168cc821dedf01519cb8c1ac9ebf921";
import {renderModelWorkbench} from "../model-workbench.js?v=f156da35e168cc821dedf01519cb8c1ac9ebf921";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
