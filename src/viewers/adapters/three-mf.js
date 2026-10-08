import {parse3MF} from "../../model/parsers/three-mf.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d";
import {mountModelScene} from "../../model/model-scene.js?v=8265cf341efb16c34da7e86656d3fa7e1f89be8d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
