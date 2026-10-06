import {parse3MF} from "../../model/parsers/three-mf.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8";
import {mountModelScene} from "../../model/model-scene.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
