import {parse3MF} from "../../model/parsers/three-mf.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419";
import {mountModelScene} from "../../model/model-scene.js?v=75fbdffb940bc6705719c3bee8680f3dcd4fa419";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
