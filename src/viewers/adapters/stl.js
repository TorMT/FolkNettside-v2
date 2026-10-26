import {parseSTL} from "../../model/parsers/stl.js?v=e421bb76bc024b4565dc7ef6480ce3cf9de4eec7";
import {renderModelWorkbench} from "../model-workbench.js?v=e421bb76bc024b4565dc7ef6480ce3cf9de4eec7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
