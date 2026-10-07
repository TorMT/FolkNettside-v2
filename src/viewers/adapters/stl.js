import {parseSTL} from "../../model/parsers/stl.js?v=16b56f584df4a49cc3339da01884f6355feee37d";
import {mountModelScene} from "../../model/model-scene.js?v=16b56f584df4a49cc3339da01884f6355feee37d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
