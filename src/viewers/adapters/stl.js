import {parseSTL} from "../../model/parsers/stl.js?v=427aa369cee6fcff6f75d61afa97012b64189770";
import {mountModelScene} from "../../model/model-scene.js?v=427aa369cee6fcff6f75d61afa97012b64189770";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
