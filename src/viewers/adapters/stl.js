import {parseSTL} from "../../model/parsers/stl.js?v=9381df14d503bbbe82d8b77c2584a1d5d5f823ba";
import {renderModelWorkbench} from "../model-workbench.js?v=9381df14d503bbbe82d8b77c2584a1d5d5f823ba";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
