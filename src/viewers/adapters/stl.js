import {parseSTL} from "../../model/parsers/stl.js?v=24d6298adb810ce7b2b5cde0d5e3e918fe0ad0cd";
import {renderModelWorkbench} from "../model-workbench.js?v=24d6298adb810ce7b2b5cde0d5e3e918fe0ad0cd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
