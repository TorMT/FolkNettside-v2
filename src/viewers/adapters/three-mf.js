import {parse3MF} from "../../model/parsers/three-mf.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca";
import {mountModelScene} from "../../model/model-scene.js?v=4e9de89a77901adf99b81fda013f0ca739a159ca";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
