import {parseSTL} from "../../model/parsers/stl.js?v=3ff657a614118f56baf85028da874e0367774ebd";
import {mountModelScene} from "../../model/model-scene.js?v=3ff657a614118f56baf85028da874e0367774ebd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
