import {parseSTL} from "../../model/parsers/stl.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21";
import {mountModelScene} from "../../model/model-scene.js?v=22b952292fde8dfad6dcea7458bc8f1b60a2cc21";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
