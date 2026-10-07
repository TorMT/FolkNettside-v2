import {parse3MF} from "../../model/parsers/three-mf.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf";
import {mountModelScene} from "../../model/model-scene.js?v=8a5f8a927bb65c6ed52fc0eeebe0eeba4ee1dfaf";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
