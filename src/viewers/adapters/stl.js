import {parseSTL} from "../../model/parsers/stl.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a";
import {mountModelScene} from "../../model/model-scene.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
