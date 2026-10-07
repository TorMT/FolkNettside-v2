import {parse3MF} from "../../model/parsers/three-mf.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac";
import {mountModelScene} from "../../model/model-scene.js?v=dead2c323df1d9c1379ab35a26c762e4b5520fac";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
