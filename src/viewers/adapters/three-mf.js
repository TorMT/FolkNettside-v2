import {parse3MF} from "../../model/parsers/three-mf.js?v=f8575958a8ef908f0b771b6c240fe7bfc8496f34";
import {renderModelWorkbench} from "../model-workbench.js?v=f8575958a8ef908f0b771b6c240fe7bfc8496f34";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
