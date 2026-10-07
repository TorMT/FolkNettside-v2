import {parse3MF} from "../../model/parsers/three-mf.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22";
import {mountModelScene} from "../../model/model-scene.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
