import {parseSTL} from "../../model/parsers/stl.js?v=6587bb4ed25b33179807200086964f7234283bef";
import {mountModelScene} from "../../model/model-scene.js?v=6587bb4ed25b33179807200086964f7234283bef";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
