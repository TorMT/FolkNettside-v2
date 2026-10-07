import {parse3MF} from "../../model/parsers/three-mf.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876";
import {mountModelScene} from "../../model/model-scene.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
