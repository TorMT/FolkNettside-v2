import {parse3MF} from "../../model/parsers/three-mf.js?v=4f96120049cd91bc89369b363db6c9d63719a367";
import {mountModelScene} from "../../model/model-scene.js?v=4f96120049cd91bc89369b363db6c9d63719a367";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
