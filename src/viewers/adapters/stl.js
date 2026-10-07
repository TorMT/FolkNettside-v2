import {parseSTL} from "../../model/parsers/stl.js?v=b1312dbafff1965033da411a6ca48957dd011d26";
import {mountModelScene} from "../../model/model-scene.js?v=b1312dbafff1965033da411a6ca48957dd011d26";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
