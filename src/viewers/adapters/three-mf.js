import {parse3MF} from "../../model/parsers/three-mf.js?v=e26a8be364148308481765cdcfc55597812e79d3";
import {mountModelScene} from "../../model/model-scene.js?v=e26a8be364148308481765cdcfc55597812e79d3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
