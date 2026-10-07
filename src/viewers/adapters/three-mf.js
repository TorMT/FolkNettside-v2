import {parse3MF} from "../../model/parsers/three-mf.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c";
import {mountModelScene} from "../../model/model-scene.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
