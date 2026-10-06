import {parse3MF} from "../../model/parsers/three-mf.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c";
import {mountModelScene} from "../../model/model-scene.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
