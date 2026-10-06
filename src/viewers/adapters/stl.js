import {parseSTL} from "../../model/parsers/stl.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6";
import {mountModelScene} from "../../model/model-scene.js?v=20a2630f606975c765a0a2dde47d69dd31779dd6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
