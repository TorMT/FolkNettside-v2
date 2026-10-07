import {parseSTL} from "../../model/parsers/stl.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83";
import {mountModelScene} from "../../model/model-scene.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
