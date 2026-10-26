import {parse3MF} from "../../model/parsers/three-mf.js?v=6b7381dcbab4670e27848d87c263d50b106c2935";
import {renderModelWorkbench} from "../model-workbench.js?v=6b7381dcbab4670e27848d87c263d50b106c2935";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
