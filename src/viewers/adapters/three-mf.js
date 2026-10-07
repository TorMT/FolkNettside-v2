import {parse3MF} from "../../model/parsers/three-mf.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894";
import {mountModelScene} from "../../model/model-scene.js?v=e895f7ca9c051157bb1f7ebe63c70c655917a894";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
