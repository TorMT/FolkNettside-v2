import {parseSTL} from "../../model/parsers/stl.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681";
import {mountModelScene} from "../../model/model-scene.js?v=105e7b78147b44dac7c4f54f7d212fd311a1f681";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
