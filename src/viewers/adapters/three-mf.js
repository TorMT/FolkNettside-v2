import {parse3MF} from "../../model/parsers/three-mf.js?v=d315816c859e0718c106f69ade1724785806956e";
import {mountModelScene} from "../../model/model-scene.js?v=d315816c859e0718c106f69ade1724785806956e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
