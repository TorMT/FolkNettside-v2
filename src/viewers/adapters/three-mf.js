import {parse3MF} from "../../model/parsers/three-mf.js?v=1d7b19ad95af0e0629853493c00513156a247f75";
import {mountModelScene} from "../../model/model-scene.js?v=1d7b19ad95af0e0629853493c00513156a247f75";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
