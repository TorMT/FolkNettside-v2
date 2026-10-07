import {parseSTL} from "../../model/parsers/stl.js?v=4f96120049cd91bc89369b363db6c9d63719a367";
import {mountModelScene} from "../../model/model-scene.js?v=4f96120049cd91bc89369b363db6c9d63719a367";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
