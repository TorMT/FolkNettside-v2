import {parseSTL} from "../../model/parsers/stl.js?v=ec0cc84acd68ba97f43b0121860c7c4febea824d";
import {renderModelWorkbench} from "../model-workbench.js?v=ec0cc84acd68ba97f43b0121860c7c4febea824d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
