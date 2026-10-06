import {parseSTL} from "../../model/parsers/stl.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6";
import {mountModelScene} from "../../model/model-scene.js?v=6c2f4986e635a040dd0ce80033ff58b471f172b6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
