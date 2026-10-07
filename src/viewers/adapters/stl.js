import {parseSTL} from "../../model/parsers/stl.js?v=f3d774892c06685186973c87dab921f08453adf7";
import {mountModelScene} from "../../model/model-scene.js?v=f3d774892c06685186973c87dab921f08453adf7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
