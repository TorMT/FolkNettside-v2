import {parse3MF} from "../../model/parsers/three-mf.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b";
import {mountModelScene} from "../../model/model-scene.js?v=d71d2fb13620dbcdd6640a1a0706bb1ec5e4e58b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
