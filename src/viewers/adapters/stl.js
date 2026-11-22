import {parseSTL} from "../../model/parsers/stl.js?v=2b353cf6da72a1d7cc61c3bad70605b408844964";
import {renderModelWorkbench} from "../model-workbench.js?v=2b353cf6da72a1d7cc61c3bad70605b408844964";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
