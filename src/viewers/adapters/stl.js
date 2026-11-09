import {parseSTL} from "../../model/parsers/stl.js?v=d3dd44b0f4d38c61ccfe442d67c2773bbdb86197";
import {renderModelWorkbench} from "../model-workbench.js?v=d3dd44b0f4d38c61ccfe442d67c2773bbdb86197";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
