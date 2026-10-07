import {parseSTL} from "../../model/parsers/stl.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8";
import {mountModelScene} from "../../model/model-scene.js?v=b4d63f08a39a33e9492a92a1c19f060ebdaf16d8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
