import {parse3MF} from "../../model/parsers/three-mf.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca";
import {mountModelScene} from "../../model/model-scene.js?v=7d3b41dda4bb5dfad00f69bb267324bfd90bbaca";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
