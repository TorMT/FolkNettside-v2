import {parseSTL} from "../../model/parsers/stl.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978";
import {mountModelScene} from "../../model/model-scene.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
