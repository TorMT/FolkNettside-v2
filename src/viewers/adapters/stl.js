import {parseSTL} from "../../model/parsers/stl.js?v=1a6f56f341ef01a7070056db44a1feadd33d0c85";
import {renderModelWorkbench} from "../model-workbench.js?v=1a6f56f341ef01a7070056db44a1feadd33d0c85";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
