import {parseSTL} from "../../model/parsers/stl.js?v=d315816c859e0718c106f69ade1724785806956e";
import {mountModelScene} from "../../model/model-scene.js?v=d315816c859e0718c106f69ade1724785806956e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
