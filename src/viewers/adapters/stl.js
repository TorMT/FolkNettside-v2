import {parseSTL} from "../../model/parsers/stl.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2";
import {mountModelScene} from "../../model/model-scene.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
