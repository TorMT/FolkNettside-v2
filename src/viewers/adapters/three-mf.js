import {parse3MF} from "../../model/parsers/three-mf.js?v=1d49bf37a70d210f866d5a0d72e26a1e73dd7cf2";
import {renderModelWorkbench} from "../model-workbench.js?v=1d49bf37a70d210f866d5a0d72e26a1e73dd7cf2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
