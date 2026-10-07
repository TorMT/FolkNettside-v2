import {parseSTL} from "../../model/parsers/stl.js?v=9b10a5208cab21508aaf459572f641924ac7e89a";
import {mountModelScene} from "../../model/model-scene.js?v=9b10a5208cab21508aaf459572f641924ac7e89a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
