import {parse3MF} from "../../model/parsers/three-mf.js?v=749b365e3de3c51d551434c241123cb3eb4adb21";
import {mountModelScene} from "../../model/model-scene.js?v=749b365e3de3c51d551434c241123cb3eb4adb21";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
