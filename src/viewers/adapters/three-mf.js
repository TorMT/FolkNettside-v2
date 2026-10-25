import {parse3MF} from "../../model/parsers/three-mf.js?v=555e981d1c77521faa9186a5ca45a1d21179f379";
import {renderModelWorkbench} from "../model-workbench.js?v=555e981d1c77521faa9186a5ca45a1d21179f379";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
