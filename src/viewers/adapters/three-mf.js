import {parse3MF} from "../../model/parsers/three-mf.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f";
import {mountModelScene} from "../../model/model-scene.js?v=15d24fd082b26072429e49ea1b48eb2f869fce4f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
