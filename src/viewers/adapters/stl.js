import {parseSTL} from "../../model/parsers/stl.js?v=56d66ac9335184d5d896f157469fcd814625e9bd";
import {mountModelScene} from "../../model/model-scene.js?v=56d66ac9335184d5d896f157469fcd814625e9bd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
