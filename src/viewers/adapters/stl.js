import {parseSTL} from "../../model/parsers/stl.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7";
import {mountModelScene} from "../../model/model-scene.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
