import {parse3MF} from "../../model/parsers/three-mf.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347";
import {mountModelScene} from "../../model/model-scene.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
