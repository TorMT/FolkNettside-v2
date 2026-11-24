import {parse3MF} from "../../model/parsers/three-mf.js?v=13299706290abf016e20abe6dc9136a9c38fd389";
import {renderModelWorkbench} from "../model-workbench.js?v=13299706290abf016e20abe6dc9136a9c38fd389";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
