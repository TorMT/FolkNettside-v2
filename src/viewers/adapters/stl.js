import {parseSTL} from "../../model/parsers/stl.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a";
import {mountModelScene} from "../../model/model-scene.js?v=42dfdf32c0b6d42e025ce0e8503609595a08e60a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
