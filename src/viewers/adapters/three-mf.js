import {parse3MF} from "../../model/parsers/three-mf.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0";
import {mountModelScene} from "../../model/model-scene.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
