import {parseSTL} from "../../model/parsers/stl.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e";
import {mountModelScene} from "../../model/model-scene.js?v=75edcad3a844dfde75fe4e36269607d98470eb8e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
