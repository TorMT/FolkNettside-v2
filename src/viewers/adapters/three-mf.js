import {parse3MF} from "../../model/parsers/three-mf.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";
import {mountModelScene} from "../../model/model-scene.js?v=69cdc183b20d0bc1e2cda04d0640789c553b993f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
