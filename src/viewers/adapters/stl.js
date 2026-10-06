import {parseSTL} from "../../model/parsers/stl.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090";
import {mountModelScene} from "../../model/model-scene.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
