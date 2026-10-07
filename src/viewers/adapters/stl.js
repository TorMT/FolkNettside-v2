import {parseSTL} from "../../model/parsers/stl.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9";
import {mountModelScene} from "../../model/model-scene.js?v=98e449fbeada9ec9259e5121157d1f2cc06602f9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
