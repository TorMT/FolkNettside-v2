import {parse3MF} from "../../model/parsers/three-mf.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50";
import {mountModelScene} from "../../model/model-scene.js?v=67ea320d9bffe172348689ae49c8ae2cb153db50";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
