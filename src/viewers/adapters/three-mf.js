import {parse3MF} from "../../model/parsers/three-mf.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82";
import {mountModelScene} from "../../model/model-scene.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
