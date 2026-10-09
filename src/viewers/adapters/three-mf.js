import {parse3MF} from "../../model/parsers/three-mf.js?v=c8321a3bee675387a645129059471c24e3f49f03";
import {renderModelWorkbench} from "../model-workbench.js?v=c8321a3bee675387a645129059471c24e3f49f03";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
