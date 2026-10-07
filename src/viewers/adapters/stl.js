import {parseSTL} from "../../model/parsers/stl.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22";
import {mountModelScene} from "../../model/model-scene.js?v=ae8ce00f9ed4d2f9dbcf3f0971000b7eefe00e22";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
