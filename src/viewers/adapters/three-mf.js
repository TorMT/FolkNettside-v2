import {parse3MF} from "../../model/parsers/three-mf.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba";
import {mountModelScene} from "../../model/model-scene.js?v=ebcd155fb5dfa51dd627ef238ea454f599e226ba";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
