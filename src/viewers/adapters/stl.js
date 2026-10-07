import {parseSTL} from "../../model/parsers/stl.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a";
import {mountModelScene} from "../../model/model-scene.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
