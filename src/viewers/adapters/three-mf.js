import {parse3MF} from "../../model/parsers/three-mf.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978";
import {mountModelScene} from "../../model/model-scene.js?v=9c203792b970cc41f82c1ad596d6c306be0f1978";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
