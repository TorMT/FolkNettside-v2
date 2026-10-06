import {parseSTL} from "../../model/parsers/stl.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd";
import {mountModelScene} from "../../model/model-scene.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
