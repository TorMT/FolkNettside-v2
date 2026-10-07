import {parseSTL} from "../../model/parsers/stl.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2";
import {mountModelScene} from "../../model/model-scene.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
