import {parseSTL} from "../../model/parsers/stl.js?v=34444ab65da3d9289cb134f51bb898853374ecb2";
import {renderModelWorkbench} from "../model-workbench.js?v=34444ab65da3d9289cb134f51bb898853374ecb2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
