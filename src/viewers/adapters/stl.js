import {parseSTL} from "../../model/parsers/stl.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4";
import {mountModelScene} from "../../model/model-scene.js?v=c9c52e3b1153b0dc22d31c8fe65ebf21f17865c4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
