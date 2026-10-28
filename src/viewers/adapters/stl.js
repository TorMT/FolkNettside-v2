import {parseSTL} from "../../model/parsers/stl.js?v=32de25f0c97c7dd494338dbc4a4ac2bb35c11c7a";
import {renderModelWorkbench} from "../model-workbench.js?v=32de25f0c97c7dd494338dbc4a4ac2bb35c11c7a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
