import {parse3MF} from "../../model/parsers/three-mf.js?v=a0d404486e2d896610962ef4b7b1358be575feed";
import {renderModelWorkbench} from "../model-workbench.js?v=a0d404486e2d896610962ef4b7b1358be575feed";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
