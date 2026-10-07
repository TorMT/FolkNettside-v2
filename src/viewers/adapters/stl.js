import {parseSTL} from "../../model/parsers/stl.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894";
import {mountModelScene} from "../../model/model-scene.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
