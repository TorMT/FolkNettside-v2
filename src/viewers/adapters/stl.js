import {parseSTL} from "../../model/parsers/stl.js?v=634ad8a5914465c1e005c6866964328b8a95df46";
import {mountModelScene} from "../../model/model-scene.js?v=634ad8a5914465c1e005c6866964328b8a95df46";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
