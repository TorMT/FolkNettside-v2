import {parse3MF} from "../../model/parsers/three-mf.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407";
import {mountModelScene} from "../../model/model-scene.js?v=b9115450f3cd4659e350430ebcfd9d1c06807407";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
