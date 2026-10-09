import {parse3MF} from "../../model/parsers/three-mf.js?v=cb8c664828c02e239eed87f23e753ac23a4592df";
import {renderModelWorkbench} from "../model-workbench.js?v=cb8c664828c02e239eed87f23e753ac23a4592df";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
