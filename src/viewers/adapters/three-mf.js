import {parse3MF} from "../../model/parsers/three-mf.js?v=1f9e96d14273012207ab14079796a0ceda4b0338";
import {renderModelWorkbench} from "../model-workbench.js?v=1f9e96d14273012207ab14079796a0ceda4b0338";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
