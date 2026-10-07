import {parseSTL} from "../../model/parsers/stl.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6";
import {mountModelScene} from "../../model/model-scene.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
