import {parse3MF} from "../../model/parsers/three-mf.js?v=d2fcf2c3b455d0b7469559cd05d7e20dc0ed8f0f";
import {renderModelWorkbench} from "../model-workbench.js?v=d2fcf2c3b455d0b7469559cd05d7e20dc0ed8f0f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
