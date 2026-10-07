import {parse3MF} from "../../model/parsers/three-mf.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad";
import {mountModelScene} from "../../model/model-scene.js?v=5fa442d4bd2eef921f1f0e325f8edd132f6765ad";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
