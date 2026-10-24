import {parse3MF} from "../../model/parsers/three-mf.js?v=89edd9aacc2e859a8494a2ef432a90ef9346c160";
import {renderModelWorkbench} from "../model-workbench.js?v=89edd9aacc2e859a8494a2ef432a90ef9346c160";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
