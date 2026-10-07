import {parse3MF} from "../../model/parsers/three-mf.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9";
import {mountModelScene} from "../../model/model-scene.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
