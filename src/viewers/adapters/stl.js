import {parseSTL} from "../../model/parsers/stl.js?v=86b20816318b8e513425aaba26beb19fd7dd8fbc";
import {renderModelWorkbench} from "../model-workbench.js?v=86b20816318b8e513425aaba26beb19fd7dd8fbc";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
