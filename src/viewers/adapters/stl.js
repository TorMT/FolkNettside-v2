import {parseSTL} from "../../model/parsers/stl.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98";
import {mountModelScene} from "../../model/model-scene.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
