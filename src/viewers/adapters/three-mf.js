import {parse3MF} from "../../model/parsers/three-mf.js?v=136e46e89466b46cf387cad36514eede66aa59c7";
import {renderModelWorkbench} from "../model-workbench.js?v=136e46e89466b46cf387cad36514eede66aa59c7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
