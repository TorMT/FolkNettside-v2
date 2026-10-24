import {parseSTL} from "../../model/parsers/stl.js?v=690036134e9b63ccd03c3d646140e5e77c7f7857";
import {renderModelWorkbench} from "../model-workbench.js?v=690036134e9b63ccd03c3d646140e5e77c7f7857";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
