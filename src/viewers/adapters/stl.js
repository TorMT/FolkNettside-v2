import {parseSTL} from "../../model/parsers/stl.js?v=b5862f49d322160eb24a824b8eca0a7461a30e26";
import {renderModelWorkbench} from "../model-workbench.js?v=b5862f49d322160eb24a824b8eca0a7461a30e26";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
