import {parse3MF} from "../../model/parsers/three-mf.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83";
import {mountModelScene} from "../../model/model-scene.js?v=51ea01e2c7f657ea3f8e90392c513a9eedf33f83";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
