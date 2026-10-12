import {parse3MF} from "../../model/parsers/three-mf.js?v=3f1c541799b268cb69f60484e17f788050c1cb27";
import {renderModelWorkbench} from "../model-workbench.js?v=3f1c541799b268cb69f60484e17f788050c1cb27";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
