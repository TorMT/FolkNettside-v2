import {parse3MF} from "../../model/parsers/three-mf.js?v=918f3b59381fa81bce33c922baf17bd845654f1e";
import {mountModelScene} from "../../model/model-scene.js?v=918f3b59381fa81bce33c922baf17bd845654f1e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
