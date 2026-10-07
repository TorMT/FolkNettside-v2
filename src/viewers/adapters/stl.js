import {parseSTL} from "../../model/parsers/stl.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5";
import {mountModelScene} from "../../model/model-scene.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
