import {parseSTL} from "../../model/parsers/stl.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76";
import {mountModelScene} from "../../model/model-scene.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
