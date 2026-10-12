import {parse3MF} from "../../model/parsers/three-mf.js?v=7efa4d6fafb6261eedaccc8a620d167dcd57ed44";
import {renderModelWorkbench} from "../model-workbench.js?v=7efa4d6fafb6261eedaccc8a620d167dcd57ed44";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
