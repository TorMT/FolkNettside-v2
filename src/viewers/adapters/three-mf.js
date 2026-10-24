import {parse3MF} from "../../model/parsers/three-mf.js?v=70515bc8df142b6fb5b040b69a41cb9bb44917a8";
import {renderModelWorkbench} from "../model-workbench.js?v=70515bc8df142b6fb5b040b69a41cb9bb44917a8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
