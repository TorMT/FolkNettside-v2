import {parse3MF} from "../../model/parsers/three-mf.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98";
import {mountModelScene} from "../../model/model-scene.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
