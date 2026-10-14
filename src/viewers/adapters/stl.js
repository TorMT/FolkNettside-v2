import {parseSTL} from "../../model/parsers/stl.js?v=d65ba3e41a01cf5123f9dcfe43581940e13ec73a";
import {renderModelWorkbench} from "../model-workbench.js?v=d65ba3e41a01cf5123f9dcfe43581940e13ec73a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
