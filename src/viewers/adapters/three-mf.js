import {parse3MF} from "../../model/parsers/three-mf.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c";
import {mountModelScene} from "../../model/model-scene.js?v=2932231072c157aa2dc69ccbcc92858f67e0a18c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
