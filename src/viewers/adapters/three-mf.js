import {parse3MF} from "../../model/parsers/three-mf.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d";
import {mountModelScene} from "../../model/model-scene.js?v=164b5e446f0c43f524299111170dc32df1fb1f6d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
