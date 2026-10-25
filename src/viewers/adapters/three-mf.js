import {parse3MF} from "../../model/parsers/three-mf.js?v=e2b4e4db3eca785d7ba5da3bfbc7f8ef321cf8c5";
import {renderModelWorkbench} from "../model-workbench.js?v=e2b4e4db3eca785d7ba5da3bfbc7f8ef321cf8c5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
