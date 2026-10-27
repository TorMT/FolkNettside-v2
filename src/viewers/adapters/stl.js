import {parseSTL} from "../../model/parsers/stl.js?v=4bd96e34e1aafda4cdf2564b222565c1d724d8f7";
import {renderModelWorkbench} from "../model-workbench.js?v=4bd96e34e1aafda4cdf2564b222565c1d724d8f7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
