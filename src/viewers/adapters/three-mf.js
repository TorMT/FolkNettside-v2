import {parse3MF} from "../../model/parsers/three-mf.js?v=cc845614f295871cd6b7894410ca75b907a64d48";
import {mountModelScene} from "../../model/model-scene.js?v=cc845614f295871cd6b7894410ca75b907a64d48";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
