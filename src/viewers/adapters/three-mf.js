import {parse3MF} from "../../model/parsers/three-mf.js?v=b0afac3f620ca5127863732bb1ff12314e31f371";
import {renderModelWorkbench} from "../model-workbench.js?v=b0afac3f620ca5127863732bb1ff12314e31f371";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
