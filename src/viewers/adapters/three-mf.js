import {parse3MF} from "../../model/parsers/three-mf.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d";
import {mountModelScene} from "../../model/model-scene.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
