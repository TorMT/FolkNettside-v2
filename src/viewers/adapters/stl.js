import {parseSTL} from "../../model/parsers/stl.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4";
import {mountModelScene} from "../../model/model-scene.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
