import {parseSTL} from "../../model/parsers/stl.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e";
import {mountModelScene} from "../../model/model-scene.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
