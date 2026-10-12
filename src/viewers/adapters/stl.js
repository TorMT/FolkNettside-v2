import {parseSTL} from "../../model/parsers/stl.js?v=0bc40a9fca92ddbf4ccee607aa1a6d1a15d910eb";
import {renderModelWorkbench} from "../model-workbench.js?v=0bc40a9fca92ddbf4ccee607aa1a6d1a15d910eb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
