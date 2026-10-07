import {parseSTL} from "../../model/parsers/stl.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {mountModelScene} from "../../model/model-scene.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
