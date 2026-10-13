import {parseSTL} from "../../model/parsers/stl.js?v=049c8c57c897de04c69668ecf1b175c29f8b840a";
import {renderModelWorkbench} from "../model-workbench.js?v=049c8c57c897de04c69668ecf1b175c29f8b840a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
