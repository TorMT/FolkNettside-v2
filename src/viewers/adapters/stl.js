import {parseSTL} from "../../model/parsers/stl.js?v=1b2df9871b099337e2126a52144046d1147577a7";
import {mountModelScene} from "../../model/model-scene.js?v=1b2df9871b099337e2126a52144046d1147577a7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
