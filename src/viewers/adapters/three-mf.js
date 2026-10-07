import {parse3MF} from "../../model/parsers/three-mf.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00";
import {mountModelScene} from "../../model/model-scene.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
