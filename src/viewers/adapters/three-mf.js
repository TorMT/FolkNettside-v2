import {parse3MF} from "../../model/parsers/three-mf.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6";
import {mountModelScene} from "../../model/model-scene.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
