import {parse3MF} from "../../model/parsers/three-mf.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4";
import {mountModelScene} from "../../model/model-scene.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
