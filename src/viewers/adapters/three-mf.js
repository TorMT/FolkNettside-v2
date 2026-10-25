import {parse3MF} from "../../model/parsers/three-mf.js?v=411f3f7a1366e88ab8e13281e586a71ad64c479b";
import {renderModelWorkbench} from "../model-workbench.js?v=411f3f7a1366e88ab8e13281e586a71ad64c479b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
