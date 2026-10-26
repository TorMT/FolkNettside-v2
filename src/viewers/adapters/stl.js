import {parseSTL} from "../../model/parsers/stl.js?v=ae4843bfa5383ce457bee87b94d92b4b8c307281";
import {renderModelWorkbench} from "../model-workbench.js?v=ae4843bfa5383ce457bee87b94d92b4b8c307281";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
