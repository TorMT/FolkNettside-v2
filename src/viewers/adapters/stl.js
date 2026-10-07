import {parseSTL} from "../../model/parsers/stl.js?v=5832043924820440b19c32d784eb81a0b11a67d8";
import {mountModelScene} from "../../model/model-scene.js?v=5832043924820440b19c32d784eb81a0b11a67d8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
