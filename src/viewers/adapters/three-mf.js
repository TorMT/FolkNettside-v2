import {parse3MF} from "../../model/parsers/three-mf.js?v=73652eb6800cc048b595e897ff33a9cab9872478";
import {mountModelScene} from "../../model/model-scene.js?v=73652eb6800cc048b595e897ff33a9cab9872478";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
