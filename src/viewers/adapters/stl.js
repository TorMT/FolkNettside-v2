import {parseSTL} from "../../model/parsers/stl.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6";
import {mountModelScene} from "../../model/model-scene.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
