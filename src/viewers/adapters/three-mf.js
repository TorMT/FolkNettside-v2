import {parse3MF} from "../../model/parsers/three-mf.js?v=37073bdccbae8ef597014f189f1d9859467ec0e6";
import {mountModelScene} from "../../model/model-scene.js?v=37073bdccbae8ef597014f189f1d9859467ec0e6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
