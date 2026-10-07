import {parseSTL} from "../../model/parsers/stl.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b";
import {mountModelScene} from "../../model/model-scene.js?v=ac28c75272bb614ac7568cfaaecfc0bcdf3c9a8b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
