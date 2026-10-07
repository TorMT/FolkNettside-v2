import {parseSTL} from "../../model/parsers/stl.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65";
import {mountModelScene} from "../../model/model-scene.js?v=4cde5fe4f18c182716f9014d81b24a48695d4c65";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
