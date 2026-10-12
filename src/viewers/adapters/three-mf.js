import {parse3MF} from "../../model/parsers/three-mf.js?v=29e3b3f6ed3a036f034be18f1316ae4c1c952efd";
import {renderModelWorkbench} from "../model-workbench.js?v=29e3b3f6ed3a036f034be18f1316ae4c1c952efd";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
