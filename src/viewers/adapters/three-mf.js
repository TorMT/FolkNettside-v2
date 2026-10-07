import {parse3MF} from "../../model/parsers/three-mf.js?v=66a32719412b4629bb066b94a400a1693fa008ca";
import {mountModelScene} from "../../model/model-scene.js?v=66a32719412b4629bb066b94a400a1693fa008ca";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
