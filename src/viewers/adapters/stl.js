import {parseSTL} from "../../model/parsers/stl.js?v=2679c75179d890c7b8dca577d8f4a170607682bd";
import {mountModelScene} from "../../model/model-scene.js?v=2679c75179d890c7b8dca577d8f4a170607682bd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
