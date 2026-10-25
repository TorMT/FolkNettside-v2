import {parse3MF} from "../../model/parsers/three-mf.js?v=147b200fd8fa2ad17fc5101436c7b76d3deb6f36";
import {renderModelWorkbench} from "../model-workbench.js?v=147b200fd8fa2ad17fc5101436c7b76d3deb6f36";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
