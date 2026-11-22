import {parse3MF} from "../../model/parsers/three-mf.js?v=d740b77b80b6a8023d9528c3e6395f02f722d911";
import {renderModelWorkbench} from "../model-workbench.js?v=d740b77b80b6a8023d9528c3e6395f02f722d911";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
