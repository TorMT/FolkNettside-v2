import {parse3MF} from "../../model/parsers/three-mf.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146";
import {mountModelScene} from "../../model/model-scene.js?v=ff6d38e988aa82e486f49c7d6547ef5458b27146";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
