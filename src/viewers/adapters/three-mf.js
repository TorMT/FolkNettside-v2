import {parse3MF} from "../../model/parsers/three-mf.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0";
import {mountModelScene} from "../../model/model-scene.js?v=852354996808f16f6f60bd42b587ac52c1e5fae0";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
