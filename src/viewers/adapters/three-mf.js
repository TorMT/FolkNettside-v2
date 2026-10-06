import {parse3MF} from "../../model/parsers/three-mf.js?v=e39b98077eed11779471c81b49cce38b5350d256";
import {mountModelScene} from "../../model/model-scene.js?v=e39b98077eed11779471c81b49cce38b5350d256";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
