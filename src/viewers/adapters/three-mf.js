import {parse3MF} from "../../model/parsers/three-mf.js?v=0c572609238258b358cd83accef2e828f95d7316";
import {mountModelScene} from "../../model/model-scene.js?v=0c572609238258b358cd83accef2e828f95d7316";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
