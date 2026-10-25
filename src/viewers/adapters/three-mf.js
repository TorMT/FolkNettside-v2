import {parse3MF} from "../../model/parsers/three-mf.js?v=ba4504c94e2d0fb6d93f6f08242d632c0b1259f8";
import {renderModelWorkbench} from "../model-workbench.js?v=ba4504c94e2d0fb6d93f6f08242d632c0b1259f8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
