import {parseSTL} from "../../model/parsers/stl.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99";
import {mountModelScene} from "../../model/model-scene.js?v=fa6edf432edddb19113bde29f18c3289c56e5f99";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
