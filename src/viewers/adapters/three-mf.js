import {parse3MF} from "../../model/parsers/three-mf.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e";
import {mountModelScene} from "../../model/model-scene.js?v=0bd0e012b4fc3482a8857b97b28f5d3962b4145e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
