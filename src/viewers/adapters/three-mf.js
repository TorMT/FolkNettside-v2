import {parse3MF} from "../../model/parsers/three-mf.js?v=c1599ffd201246a75c7bfb3ff17388ef86f301d1";
import {renderModelWorkbench} from "../model-workbench.js?v=c1599ffd201246a75c7bfb3ff17388ef86f301d1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
