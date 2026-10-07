import {parseSTL} from "../../model/parsers/stl.js?v=37073bdccbae8ef597014f189f1d9859467ec0e6";
import {mountModelScene} from "../../model/model-scene.js?v=37073bdccbae8ef597014f189f1d9859467ec0e6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
