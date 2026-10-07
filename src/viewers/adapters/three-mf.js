import {parse3MF} from "../../model/parsers/three-mf.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a";
import {mountModelScene} from "../../model/model-scene.js?v=f23ab9fab9baa23e553179d7b4acd29ca057fc5a";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
