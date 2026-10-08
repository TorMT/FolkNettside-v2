import {parseSTL} from "../../model/parsers/stl.js?v=9ba544c6579d47d9412094088927a3839d39f7a0";
import {mountModelScene} from "../../model/model-scene.js?v=9ba544c6579d47d9412094088927a3839d39f7a0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
