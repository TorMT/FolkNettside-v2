import {parse3MF} from "../../model/parsers/three-mf.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b";
import {mountModelScene} from "../../model/model-scene.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
