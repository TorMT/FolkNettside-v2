import {parseSTL} from "../../model/parsers/stl.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e";
import {mountModelScene} from "../../model/model-scene.js?v=7d2427e98343c840de7ed0c1f7aa454d4631164e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
