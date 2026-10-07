import {parseSTL} from "../../model/parsers/stl.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735";
import {mountModelScene} from "../../model/model-scene.js?v=a3584248ac50cdb70d8398e9164e1981fa7ab735";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
