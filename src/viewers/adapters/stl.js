import {parseSTL} from "../../model/parsers/stl.js?v=a9b99ee88974141a595afc683db34eea2547479f";
import {mountModelScene} from "../../model/model-scene.js?v=a9b99ee88974141a595afc683db34eea2547479f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
