import {parseSTL} from "../../model/parsers/stl.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88";
import {mountModelScene} from "../../model/model-scene.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
