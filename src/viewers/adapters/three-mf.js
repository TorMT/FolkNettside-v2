import {parse3MF} from "../../model/parsers/three-mf.js?v=3f5675e920938ba29b8f09b2c8ed5613e7f3dbed";
import {renderModelWorkbench} from "../model-workbench.js?v=3f5675e920938ba29b8f09b2c8ed5613e7f3dbed";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
