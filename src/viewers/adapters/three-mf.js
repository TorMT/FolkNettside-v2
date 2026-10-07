import {parse3MF} from "../../model/parsers/three-mf.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18";
import {mountModelScene} from "../../model/model-scene.js?v=ce7dc47e050078d6e3ae66ef31d711179881cb18";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
