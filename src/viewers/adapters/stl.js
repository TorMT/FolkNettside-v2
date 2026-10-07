import {parseSTL} from "../../model/parsers/stl.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653";
import {mountModelScene} from "../../model/model-scene.js?v=b1c47faa77aa19c57dc5974d38fd8a58d2fbf653";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
