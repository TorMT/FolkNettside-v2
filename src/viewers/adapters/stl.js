import {parseSTL} from "../../model/parsers/stl.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd";
import {mountModelScene} from "../../model/model-scene.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
