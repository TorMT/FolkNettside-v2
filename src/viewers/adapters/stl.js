import {parseSTL} from "../../model/parsers/stl.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140";
import {mountModelScene} from "../../model/model-scene.js?v=83ad0451cf225e3bc6d18ce2d39a30083efa1140";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
