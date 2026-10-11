import {parse3MF} from "../../model/parsers/three-mf.js?v=5a496961006738533ec7704bd3407d5fe3a43506";
import {renderModelWorkbench} from "../model-workbench.js?v=5a496961006738533ec7704bd3407d5fe3a43506";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
