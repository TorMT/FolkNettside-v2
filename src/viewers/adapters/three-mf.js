import {parse3MF} from "../../model/parsers/three-mf.js?v=46bddceaaf4ff12ec3dcab93f4def90ebf58e582";
import {renderModelWorkbench} from "../model-workbench.js?v=46bddceaaf4ff12ec3dcab93f4def90ebf58e582";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
