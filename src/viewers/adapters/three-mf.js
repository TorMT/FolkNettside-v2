import {parse3MF} from "../../model/parsers/three-mf.js?v=ec0cc84acd68ba97f43b0121860c7c4febea824d";
import {renderModelWorkbench} from "../model-workbench.js?v=ec0cc84acd68ba97f43b0121860c7c4febea824d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
