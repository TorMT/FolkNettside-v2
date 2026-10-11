import {parse3MF} from "../../model/parsers/three-mf.js?v=132013825d145c941b3130fd96ad64721ba11663";
import {renderModelWorkbench} from "../model-workbench.js?v=132013825d145c941b3130fd96ad64721ba11663";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
