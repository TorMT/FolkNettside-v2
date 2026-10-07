import {parse3MF} from "../../model/parsers/three-mf.js?v=380e9d0432f71953908a58630b8159100e439b22";
import {mountModelScene} from "../../model/model-scene.js?v=380e9d0432f71953908a58630b8159100e439b22";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
