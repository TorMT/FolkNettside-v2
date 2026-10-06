import {parseSTL} from "../../model/parsers/stl.js?v=0229689279d590d75553a254f7674b17d66813e0";
import {mountModelScene} from "../../model/model-scene.js?v=0229689279d590d75553a254f7674b17d66813e0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
