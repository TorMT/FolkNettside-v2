import {parseSTL} from "../../model/parsers/stl.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1";
import {mountModelScene} from "../../model/model-scene.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
