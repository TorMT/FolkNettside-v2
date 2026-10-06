import {parse3MF} from "../../model/parsers/three-mf.js?v=c4d711984d388bef3791c769968f6ea69188349b";
import {mountModelScene} from "../../model/model-scene.js?v=c4d711984d388bef3791c769968f6ea69188349b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
