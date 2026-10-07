import {parse3MF} from "../../model/parsers/three-mf.js?v=45f0c87cf82a120173ca472434b0924971b680b7";
import {mountModelScene} from "../../model/model-scene.js?v=45f0c87cf82a120173ca472434b0924971b680b7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
