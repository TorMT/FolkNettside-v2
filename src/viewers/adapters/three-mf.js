import {parse3MF} from "../../model/parsers/three-mf.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d";
import {mountModelScene} from "../../model/model-scene.js?v=10a29eb770e74cc9694d93d008ded421388d6f3d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
