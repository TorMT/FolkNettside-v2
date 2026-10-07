import {parseSTL} from "../../model/parsers/stl.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb";
import {mountModelScene} from "../../model/model-scene.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
