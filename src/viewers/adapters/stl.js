import {parseSTL} from "../../model/parsers/stl.js?v=629edfb958bddabdc52f1005397529a1901ff610";
import {renderModelWorkbench} from "../model-workbench.js?v=629edfb958bddabdc52f1005397529a1901ff610";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
