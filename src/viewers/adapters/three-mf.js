import {parse3MF} from "../../model/parsers/three-mf.js?v=4bd96e34e1aafda4cdf2564b222565c1d724d8f7";
import {renderModelWorkbench} from "../model-workbench.js?v=4bd96e34e1aafda4cdf2564b222565c1d724d8f7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
