import {parseSTL} from "../../model/parsers/stl.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c";
import {mountModelScene} from "../../model/model-scene.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
