import {parse3MF} from "../../model/parsers/three-mf.js?v=542dc505dd26a315402debc65322c61cf5f197b2";
import {renderModelWorkbench} from "../model-workbench.js?v=542dc505dd26a315402debc65322c61cf5f197b2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
