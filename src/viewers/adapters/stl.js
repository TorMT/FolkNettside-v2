import {parseSTL} from "../../model/parsers/stl.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257";
import {mountModelScene} from "../../model/model-scene.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
