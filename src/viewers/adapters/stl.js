import {parseSTL} from "../../model/parsers/stl.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9";
import {mountModelScene} from "../../model/model-scene.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
