import {parseSTL} from "../../model/parsers/stl.js?v=973646479ea14319b0ab8e3aafaf6e476432af73";
import {mountModelScene} from "../../model/model-scene.js?v=973646479ea14319b0ab8e3aafaf6e476432af73";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
