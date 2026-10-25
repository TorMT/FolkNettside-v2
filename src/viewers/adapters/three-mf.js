import {parse3MF} from "../../model/parsers/three-mf.js?v=9f227c0035f93c85f02e5f4d20c40d9e9f0b2afb";
import {renderModelWorkbench} from "../model-workbench.js?v=9f227c0035f93c85f02e5f4d20c40d9e9f0b2afb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
