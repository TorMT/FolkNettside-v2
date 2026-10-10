import {parse3MF} from "../../model/parsers/three-mf.js?v=9bf8435c998032db93e884790ca38463e6459db6";
import {renderModelWorkbench} from "../model-workbench.js?v=9bf8435c998032db93e884790ca38463e6459db6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
