import {parse3MF} from "../../model/parsers/three-mf.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd";
import {mountModelScene} from "../../model/model-scene.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
