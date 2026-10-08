import {parse3MF} from "../../model/parsers/three-mf.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847";
import {mountModelScene} from "../../model/model-scene.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
