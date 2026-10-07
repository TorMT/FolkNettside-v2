import {parseSTL} from "../../model/parsers/stl.js?v=2537e12ee4dd65bbcec0a37f598b5f92e6660b22";
import {mountModelScene} from "../../model/model-scene.js?v=2537e12ee4dd65bbcec0a37f598b5f92e6660b22";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
