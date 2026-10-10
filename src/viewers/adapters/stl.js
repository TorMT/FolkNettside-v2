import {parseSTL} from "../../model/parsers/stl.js?v=aea0dc54b4840d4b95c890f209b51965789e75ca";
import {renderModelWorkbench} from "../model-workbench.js?v=aea0dc54b4840d4b95c890f209b51965789e75ca";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
