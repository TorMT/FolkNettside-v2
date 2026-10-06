import {parse3MF} from "../../model/parsers/three-mf.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295";
import {mountModelScene} from "../../model/model-scene.js?v=eb34a4b67aa36e3a2a61f80894de45fb26e16295";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
