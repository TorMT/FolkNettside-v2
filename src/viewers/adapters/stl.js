import {parseSTL} from "../../model/parsers/stl.js?v=6107a75ee9edc7a765b5fbcb07069998f2366f5d";
import {renderModelWorkbench} from "../model-workbench.js?v=6107a75ee9edc7a765b5fbcb07069998f2366f5d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
