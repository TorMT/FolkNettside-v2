import {parseSTL} from "../../model/parsers/stl.js?v=5847de308f81a28abf005e6bee53d1782423cc42";
import {mountModelScene} from "../../model/model-scene.js?v=5847de308f81a28abf005e6bee53d1782423cc42";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
