import {parseSTL} from "../../model/parsers/stl.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c";
import {mountModelScene} from "../../model/model-scene.js?v=c69e5661d7e556b5fc6742e3b25062c589a9583c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
