import {parse3MF} from "../../model/parsers/three-mf.js?v=550c686e525379e56f097a44bdadbeaec2d9da0a";
import {renderModelWorkbench} from "../model-workbench.js?v=550c686e525379e56f097a44bdadbeaec2d9da0a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
