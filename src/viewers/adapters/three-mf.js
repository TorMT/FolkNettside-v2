import {parse3MF} from "../../model/parsers/three-mf.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8";
import {mountModelScene} from "../../model/model-scene.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
