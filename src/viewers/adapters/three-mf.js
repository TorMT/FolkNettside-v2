import {parse3MF} from "../../model/parsers/three-mf.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07";
import {mountModelScene} from "../../model/model-scene.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
