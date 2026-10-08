import {parseSTL} from "../../model/parsers/stl.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02";
import {mountModelScene} from "../../model/model-scene.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
