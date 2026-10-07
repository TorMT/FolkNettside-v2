import {parseSTL} from "../../model/parsers/stl.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c";
import {mountModelScene} from "../../model/model-scene.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
