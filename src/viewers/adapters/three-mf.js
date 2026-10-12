import {parse3MF} from "../../model/parsers/three-mf.js?v=5465842a0ede545623ecfc153e531bd300f85e0e";
import {renderModelWorkbench} from "../model-workbench.js?v=5465842a0ede545623ecfc153e531bd300f85e0e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
