import {parse3MF} from "../../model/parsers/three-mf.js?v=ed67bb88a47eadd9c5a1ef13588681d2a3f74c8c";
import {renderModelWorkbench} from "../model-workbench.js?v=ed67bb88a47eadd9c5a1ef13588681d2a3f74c8c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
