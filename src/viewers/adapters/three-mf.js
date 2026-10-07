import {parse3MF} from "../../model/parsers/three-mf.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76";
import {mountModelScene} from "../../model/model-scene.js?v=0484f09b3e21917a05552c5b92460bb5e370dd76";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
