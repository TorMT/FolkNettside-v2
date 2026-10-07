import {parseSTL} from "../../model/parsers/stl.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc";
import {mountModelScene} from "../../model/model-scene.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
