import {parse3MF} from "../../model/parsers/three-mf.js?v=4919690a518f8ded39c5116aac403a61323a3929";
import {mountModelScene} from "../../model/model-scene.js?v=4919690a518f8ded39c5116aac403a61323a3929";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
