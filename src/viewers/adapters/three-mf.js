import {parse3MF} from "../../model/parsers/three-mf.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648";
import {mountModelScene} from "../../model/model-scene.js?v=9cdf3c9a5a5a32ae9a1e8c2f305df694984c9648";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
