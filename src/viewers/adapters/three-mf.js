import {parse3MF} from "../../model/parsers/three-mf.js?v=59759b72209ea5f70352282e4d1ca742cf6d2efe";
import {renderModelWorkbench} from "../model-workbench.js?v=59759b72209ea5f70352282e4d1ca742cf6d2efe";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
