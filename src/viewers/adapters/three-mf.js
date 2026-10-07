import {parse3MF} from "../../model/parsers/three-mf.js?v=7f81d63463d242e3870c629107545db3e05e4889";
import {mountModelScene} from "../../model/model-scene.js?v=7f81d63463d242e3870c629107545db3e05e4889";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
