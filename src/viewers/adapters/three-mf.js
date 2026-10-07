import {parse3MF} from "../../model/parsers/three-mf.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6";
import {mountModelScene} from "../../model/model-scene.js?v=3f108cb91886ef154b7f3ea2694d30f3ff8da5d6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
