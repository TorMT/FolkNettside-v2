import {parseSTL} from "../../model/parsers/stl.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef";
import {mountModelScene} from "../../model/model-scene.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
