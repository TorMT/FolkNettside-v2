import {parse3MF} from "../../model/parsers/three-mf.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b";
import {mountModelScene} from "../../model/model-scene.js?v=fc8bcbd64da2cc56bfad209bef30171cadf1026b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
