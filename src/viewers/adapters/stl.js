import {parseSTL} from "../../model/parsers/stl.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17";
import {mountModelScene} from "../../model/model-scene.js?v=099cde899d35cd7dab76d3d7d0cafd768af8ee17";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
