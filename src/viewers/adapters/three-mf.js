import {parse3MF} from "../../model/parsers/three-mf.js?v=9067ffb63940252c410651966c2672298eb6f55e";
import {mountModelScene} from "../../model/model-scene.js?v=9067ffb63940252c410651966c2672298eb6f55e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
