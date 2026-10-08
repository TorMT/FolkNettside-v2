import {parseSTL} from "../../model/parsers/stl.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a";
import {mountModelScene} from "../../model/model-scene.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
