import {parse3MF} from "../../model/parsers/three-mf.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb";
import {mountModelScene} from "../../model/model-scene.js?v=6dd95082c857b5cdbf7a42e3723a99c97486befb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
