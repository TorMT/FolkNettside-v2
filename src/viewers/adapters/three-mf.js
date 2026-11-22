import {parse3MF} from "../../model/parsers/three-mf.js?v=76e1eaf009bc8ca0dcb60309b8eabc8000ff62e8";
import {renderModelWorkbench} from "../model-workbench.js?v=76e1eaf009bc8ca0dcb60309b8eabc8000ff62e8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
