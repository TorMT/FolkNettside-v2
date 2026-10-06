import {parseSTL} from "../../model/parsers/stl.js?v=fc6088e97be38f728db2b9e6a89d92c339303629";
import {mountModelScene} from "../../model/model-scene.js?v=fc6088e97be38f728db2b9e6a89d92c339303629";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
