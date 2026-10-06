import {parseSTL} from "../../model/parsers/stl.js?v=8aa0c11932670c127bfa632341edc0b2d5192849";
import {mountModelScene} from "../../model/model-scene.js?v=8aa0c11932670c127bfa632341edc0b2d5192849";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
