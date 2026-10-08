import {parseSTL} from "../../model/parsers/stl.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847";
import {mountModelScene} from "../../model/model-scene.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
