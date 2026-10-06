import {parseSTL} from "../../model/parsers/stl.js?v=e20b7932369f663022714d061be3a7037a33b0d5";
import {mountModelScene} from "../../model/model-scene.js?v=e20b7932369f663022714d061be3a7037a33b0d5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
