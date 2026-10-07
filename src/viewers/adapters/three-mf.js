import {parse3MF} from "../../model/parsers/three-mf.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8";
import {mountModelScene} from "../../model/model-scene.js?v=bbb2b2f4c426333ce3da1d1628dca05fd24adcf8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
