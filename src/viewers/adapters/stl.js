import {parseSTL} from "../../model/parsers/stl.js?v=736846c68df99c645bae84f521ba552176960f68";
import {mountModelScene} from "../../model/model-scene.js?v=736846c68df99c645bae84f521ba552176960f68";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
