import {parseSTL} from "../../model/parsers/stl.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2";
import {mountModelScene} from "../../model/model-scene.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
