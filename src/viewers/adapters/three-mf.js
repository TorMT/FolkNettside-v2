import {parse3MF} from "../../model/parsers/three-mf.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe";
import {mountModelScene} from "../../model/model-scene.js?v=e3661dc11e4ff520d16528e0789e41e497492bbe";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
