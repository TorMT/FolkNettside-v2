import {parseSTL} from "../../model/parsers/stl.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
import {renderModelWorkbench} from "../model-workbench.js?v=143ce2ba2c492aff2d441de71e89a31c1409e580";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
