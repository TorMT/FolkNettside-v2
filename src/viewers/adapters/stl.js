import {parseSTL} from "../../model/parsers/stl.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39";
import {mountModelScene} from "../../model/model-scene.js?v=fcceb5d6da9f38c2b8936c298a117e77b8f02c39";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
