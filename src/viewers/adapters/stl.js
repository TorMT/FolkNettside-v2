import {parseSTL} from "../../model/parsers/stl.js?v=17424844b3d92523b8b57661368abfd83bf5b431";
import {renderModelWorkbench} from "../model-workbench.js?v=17424844b3d92523b8b57661368abfd83bf5b431";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
