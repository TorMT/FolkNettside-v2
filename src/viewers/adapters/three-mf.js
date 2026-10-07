import {parse3MF} from "../../model/parsers/three-mf.js?v=d106ea86f48645e34739613dfedefbaa817698fb";
import {mountModelScene} from "../../model/model-scene.js?v=d106ea86f48645e34739613dfedefbaa817698fb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
