import {parseSTL} from "../../model/parsers/stl.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3";
import {mountModelScene} from "../../model/model-scene.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
