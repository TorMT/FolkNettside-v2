import {parse3MF} from "../../model/parsers/three-mf.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f";
import {mountModelScene} from "../../model/model-scene.js?v=5cfb1ce8b44c7e497d991f68d6b9220c9e15051f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
