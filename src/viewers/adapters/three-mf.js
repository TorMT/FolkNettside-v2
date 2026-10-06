import {parse3MF} from "../../model/parsers/three-mf.js?v=1093b9e37081cef71bae129b78834bb0ea84232a";
import {mountModelScene} from "../../model/model-scene.js?v=1093b9e37081cef71bae129b78834bb0ea84232a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
