import {parse3MF} from "../../model/parsers/three-mf.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243";
import {mountModelScene} from "../../model/model-scene.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
