import {parse3MF} from "../../model/parsers/three-mf.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257";
import {mountModelScene} from "../../model/model-scene.js?v=ae89d6567d6a397441653a8ba2af6ac8471d6257";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
