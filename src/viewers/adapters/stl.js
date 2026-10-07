import {parseSTL} from "../../model/parsers/stl.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c";
import {mountModelScene} from "../../model/model-scene.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
