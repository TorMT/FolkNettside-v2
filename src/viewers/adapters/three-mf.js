import {parse3MF} from "../../model/parsers/three-mf.js?v=a74d6e80c206c18560d176157cc5752b2144f976";
import {mountModelScene} from "../../model/model-scene.js?v=a74d6e80c206c18560d176157cc5752b2144f976";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
