import {parse3MF} from "../../model/parsers/three-mf.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c";
import {mountModelScene} from "../../model/model-scene.js?v=1e0f3adc216cf30705f88079bd3cc77faa448c1c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
