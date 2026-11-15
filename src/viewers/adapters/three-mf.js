import {parse3MF} from "../../model/parsers/three-mf.js?v=7ed855647cd6e9cf86c889a9855aae891c4a2029";
import {renderModelWorkbench} from "../model-workbench.js?v=7ed855647cd6e9cf86c889a9855aae891c4a2029";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
