import {parseSTL} from "../../model/parsers/stl.js?v=3addd6f7ca32031daa045b013932d00187968508";
import {mountModelScene} from "../../model/model-scene.js?v=3addd6f7ca32031daa045b013932d00187968508";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
