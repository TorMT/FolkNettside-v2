import {parse3MF} from "../../model/parsers/three-mf.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe";
import {mountModelScene} from "../../model/model-scene.js?v=ced39fef1175d0aebcfd8e5f61676759bfef65fe";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
