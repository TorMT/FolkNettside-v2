import {parseSTL} from "../../model/parsers/stl.js?v=0c572609238258b358cd83accef2e828f95d7316";
import {mountModelScene} from "../../model/model-scene.js?v=0c572609238258b358cd83accef2e828f95d7316";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
