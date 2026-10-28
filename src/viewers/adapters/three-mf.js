import {parse3MF} from "../../model/parsers/three-mf.js?v=ccc1ecac0233715636ff562a37129782179e56e9";
import {renderModelWorkbench} from "../model-workbench.js?v=ccc1ecac0233715636ff562a37129782179e56e9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
