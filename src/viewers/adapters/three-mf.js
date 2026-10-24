import {parse3MF} from "../../model/parsers/three-mf.js?v=228b73eb14255367ff327e4fa097975410ecc9e5";
import {renderModelWorkbench} from "../model-workbench.js?v=228b73eb14255367ff327e4fa097975410ecc9e5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
