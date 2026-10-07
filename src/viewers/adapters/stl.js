import {parseSTL} from "../../model/parsers/stl.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128";
import {mountModelScene} from "../../model/model-scene.js?v=4a1b580e95f85b58424a7fee7219636ca7a53128";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
