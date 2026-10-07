import {parse3MF} from "../../model/parsers/three-mf.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f";
import {mountModelScene} from "../../model/model-scene.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
