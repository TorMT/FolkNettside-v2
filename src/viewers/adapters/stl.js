import {parseSTL} from "../../model/parsers/stl.js?v=a435f153ef7e9408be42556149dd61c3928ec506";
import {mountModelScene} from "../../model/model-scene.js?v=a435f153ef7e9408be42556149dd61c3928ec506";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
