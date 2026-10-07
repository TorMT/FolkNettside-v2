import {parse3MF} from "../../model/parsers/three-mf.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995";
import {mountModelScene} from "../../model/model-scene.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
