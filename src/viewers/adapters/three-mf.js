import {parse3MF} from "../../model/parsers/three-mf.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06";
import {mountModelScene} from "../../model/model-scene.js?v=b039753dac8ba3a2d07f198464d774a501f5ab06";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
