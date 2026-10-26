import {parseSTL} from "../../model/parsers/stl.js?v=84177f32400192672f680271d27ceb3986e41ee1";
import {renderModelWorkbench} from "../model-workbench.js?v=84177f32400192672f680271d27ceb3986e41ee1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
