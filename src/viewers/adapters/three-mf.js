import {parse3MF} from "../../model/parsers/three-mf.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f";
import {mountModelScene} from "../../model/model-scene.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
