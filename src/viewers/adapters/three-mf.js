import {parse3MF} from "../../model/parsers/three-mf.js?v=510af458c226b1733e776f322333b3484e2c8c72";
import {mountModelScene} from "../../model/model-scene.js?v=510af458c226b1733e776f322333b3484e2c8c72";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
