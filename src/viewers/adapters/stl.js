import {parseSTL} from "../../model/parsers/stl.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b";
import {mountModelScene} from "../../model/model-scene.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
