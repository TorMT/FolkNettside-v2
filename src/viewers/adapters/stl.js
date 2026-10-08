import {parseSTL} from "../../model/parsers/stl.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a";
import {mountModelScene} from "../../model/model-scene.js?v=661c6ec2d37789ce0c91dcd7f45c6cf80188944a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
