import {parseSTL} from "../../model/parsers/stl.js?v=adaf31ee0f1c2b0c71c1bde514746b5fbd3ee61d";
import {renderModelWorkbench} from "../model-workbench.js?v=adaf31ee0f1c2b0c71c1bde514746b5fbd3ee61d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
