import {parseSTL} from "../../model/parsers/stl.js?v=a86c590a4cc4c2a711867cba41af767bff1478b9";
import {renderModelWorkbench} from "../model-workbench.js?v=a86c590a4cc4c2a711867cba41af767bff1478b9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
