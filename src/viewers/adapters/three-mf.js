import {parse3MF} from "../../model/parsers/three-mf.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10";
import {mountModelScene} from "../../model/model-scene.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
