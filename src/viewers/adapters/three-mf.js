import {parse3MF} from "../../model/parsers/three-mf.js?v=a56ceec4b1cce9377be321761db205db6c2e4721";
import {mountModelScene} from "../../model/model-scene.js?v=a56ceec4b1cce9377be321761db205db6c2e4721";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
