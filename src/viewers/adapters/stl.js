import {parseSTL} from "../../model/parsers/stl.js?v=0c02eed5423cb2039ecb3ce212d6643dc2fc62d5";
import {mountModelScene} from "../../model/model-scene.js?v=0c02eed5423cb2039ecb3ce212d6643dc2fc62d5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
