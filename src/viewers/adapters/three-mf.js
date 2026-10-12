import {parse3MF} from "../../model/parsers/three-mf.js?v=515e72cee5b4431707655d8c10655d8720665b43";
import {renderModelWorkbench} from "../model-workbench.js?v=515e72cee5b4431707655d8c10655d8720665b43";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
