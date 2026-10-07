import {parseSTL} from "../../model/parsers/stl.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890";
import {mountModelScene} from "../../model/model-scene.js?v=d7a77dcc434279c45f086b67d5851f5fccc8c890";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
