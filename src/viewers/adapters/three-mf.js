import {parse3MF} from "../../model/parsers/three-mf.js?v=7ad2c067446e996584637c569ccd95576101aea7";
import {mountModelScene} from "../../model/model-scene.js?v=7ad2c067446e996584637c569ccd95576101aea7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
