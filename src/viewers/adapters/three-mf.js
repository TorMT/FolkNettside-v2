import {parse3MF} from "../../model/parsers/three-mf.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97";
import {mountModelScene} from "../../model/model-scene.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
