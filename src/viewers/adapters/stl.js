import {parseSTL} from "../../model/parsers/stl.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";
import {mountModelScene} from "../../model/model-scene.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
