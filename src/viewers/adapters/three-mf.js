import {parse3MF} from "../../model/parsers/three-mf.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";
import {renderModelWorkbench} from "../model-workbench.js?v=20c62fd1f2072e677ffaeec8435ff766e7624aed";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
