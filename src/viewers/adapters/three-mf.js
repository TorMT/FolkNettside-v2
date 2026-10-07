import {parse3MF} from "../../model/parsers/three-mf.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6";
import {mountModelScene} from "../../model/model-scene.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
