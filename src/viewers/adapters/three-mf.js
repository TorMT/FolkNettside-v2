import {parse3MF} from "../../model/parsers/three-mf.js?v=5832043924820440b19c32d784eb81a0b11a67d8";
import {mountModelScene} from "../../model/model-scene.js?v=5832043924820440b19c32d784eb81a0b11a67d8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
