import {parse3MF} from "../../model/parsers/three-mf.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
import {mountModelScene} from "../../model/model-scene.js?v=9e61ba286b76ef5509eb7bad6b1da964c80c5f68";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
