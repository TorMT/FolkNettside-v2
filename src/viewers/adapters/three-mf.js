import {parse3MF} from "../../model/parsers/three-mf.js?v=0229689279d590d75553a254f7674b17d66813e0";
import {mountModelScene} from "../../model/model-scene.js?v=0229689279d590d75553a254f7674b17d66813e0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
