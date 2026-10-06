import {parseSTL} from "../../model/parsers/stl.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34";
import {mountModelScene} from "../../model/model-scene.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
