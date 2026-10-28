import {parseSTL} from "../../model/parsers/stl.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
import {renderModelWorkbench} from "../model-workbench.js?v=af205f8fa5f9c95418543446d58c9f0db93f34d9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
