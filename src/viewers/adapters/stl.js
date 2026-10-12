import {parseSTL} from "../../model/parsers/stl.js?v=acc72226fb6382002d92080427a699bd021eb8ca";
import {renderModelWorkbench} from "../model-workbench.js?v=acc72226fb6382002d92080427a699bd021eb8ca";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
