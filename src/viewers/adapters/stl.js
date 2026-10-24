import {parseSTL} from "../../model/parsers/stl.js?v=b9ae778ce3927c136b5fbeb8999faafd146d118f";
import {renderModelWorkbench} from "../model-workbench.js?v=b9ae778ce3927c136b5fbeb8999faafd146d118f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
