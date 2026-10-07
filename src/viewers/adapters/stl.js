import {parseSTL} from "../../model/parsers/stl.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50";
import {mountModelScene} from "../../model/model-scene.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
