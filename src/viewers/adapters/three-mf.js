import {parse3MF} from "../../model/parsers/three-mf.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1";
import {mountModelScene} from "../../model/model-scene.js?v=0ba145647f4dceaa1b572ead8d399f35f9ddcab1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
