import {parse3MF} from "../../model/parsers/three-mf.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6";
import {mountModelScene} from "../../model/model-scene.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
