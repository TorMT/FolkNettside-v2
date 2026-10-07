import {parse3MF} from "../../model/parsers/three-mf.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed";
import {mountModelScene} from "../../model/model-scene.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
