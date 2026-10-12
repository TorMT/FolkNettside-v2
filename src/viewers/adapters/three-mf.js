import {parse3MF} from "../../model/parsers/three-mf.js?v=c314d33bbaad672fe8cee5ba13143c9415125fb5";
import {renderModelWorkbench} from "../model-workbench.js?v=c314d33bbaad672fe8cee5ba13143c9415125fb5";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
