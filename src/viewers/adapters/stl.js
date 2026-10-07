import {parseSTL} from "../../model/parsers/stl.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e";
import {mountModelScene} from "../../model/model-scene.js?v=6813707a934332e7cc5b87de3d1720223ef6e32e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
