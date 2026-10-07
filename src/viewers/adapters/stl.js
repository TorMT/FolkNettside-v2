import {parseSTL} from "../../model/parsers/stl.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10";
import {mountModelScene} from "../../model/model-scene.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
