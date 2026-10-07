import {parseSTL} from "../../model/parsers/stl.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4";
import {mountModelScene} from "../../model/model-scene.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
