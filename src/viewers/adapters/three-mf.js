import {parse3MF} from "../../model/parsers/three-mf.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2";
import {mountModelScene} from "../../model/model-scene.js?v=cb92b24e6c0af0fb5449c833ac43e7b2ac8043d2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
