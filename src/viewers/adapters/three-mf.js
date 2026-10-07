import {parse3MF} from "../../model/parsers/three-mf.js?v=6e5390c2179306a1067152159265834028535831";
import {mountModelScene} from "../../model/model-scene.js?v=6e5390c2179306a1067152159265834028535831";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
