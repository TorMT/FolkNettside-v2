import {parseSTL} from "../../model/parsers/stl.js?v=517fa01abd7ebd8a6697b3d6b38db560a425a684";
import {renderModelWorkbench} from "../model-workbench.js?v=517fa01abd7ebd8a6697b3d6b38db560a425a684";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
