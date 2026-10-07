import {parseSTL} from "../../model/parsers/stl.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334";
import {mountModelScene} from "../../model/model-scene.js?v=fc84dbc188e48781c36d809aa23836a0f4c11334";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return mountModelScene(container,model);
}
