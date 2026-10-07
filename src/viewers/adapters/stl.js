import {parseSTL} from "../../model/parsers/stl.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10";
import {mountModelScene} from "../../model/model-scene.js?v=99afeed3d40e8fa5e04f1b4d73839fd2f9967e10";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
