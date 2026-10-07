import {parse3MF} from "../../model/parsers/three-mf.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a";
import {mountModelScene} from "../../model/model-scene.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
