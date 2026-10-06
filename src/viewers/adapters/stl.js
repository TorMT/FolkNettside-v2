import {parseSTL} from "../../model/parsers/stl.js";
import {mountModelScene} from "../../model/model-scene.js";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
