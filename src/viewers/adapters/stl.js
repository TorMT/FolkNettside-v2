import {parseSTL} from "../../model/parsers/stl.js?v=439be6158911a81eeccd51736fd86516852c6ed7";
import {renderModelWorkbench} from "../model-workbench.js?v=439be6158911a81eeccd51736fd86516852c6ed7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
