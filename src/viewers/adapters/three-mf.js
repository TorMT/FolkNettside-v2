import {parse3MF} from "../../model/parsers/three-mf.js?v=ea9e4b4a294a186aa2045fac4e863491e23720f5";
import {renderModelWorkbench} from "../model-workbench.js?v=ea9e4b4a294a186aa2045fac4e863491e23720f5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
