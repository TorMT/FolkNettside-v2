import {parseSTL} from "../../model/parsers/stl.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375";
import {mountModelScene} from "../../model/model-scene.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
