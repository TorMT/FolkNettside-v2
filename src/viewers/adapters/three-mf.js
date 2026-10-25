import {parse3MF} from "../../model/parsers/three-mf.js?v=1a5d33cf26324c375016ebf9780d16b2bf5c8fad";
import {renderModelWorkbench} from "../model-workbench.js?v=1a5d33cf26324c375016ebf9780d16b2bf5c8fad";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
