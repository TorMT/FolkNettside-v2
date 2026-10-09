import {parse3MF} from "../../model/parsers/three-mf.js?v=643dfdb81d5ea07b42f66658b2cef5d0af15b430";
import {renderModelWorkbench} from "../model-workbench.js?v=643dfdb81d5ea07b42f66658b2cef5d0af15b430";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
