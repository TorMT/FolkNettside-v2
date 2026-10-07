import {parseSTL} from "../../model/parsers/stl.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00";
import {mountModelScene} from "../../model/model-scene.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
