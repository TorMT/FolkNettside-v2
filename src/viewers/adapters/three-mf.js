import {parse3MF} from "../../model/parsers/three-mf.js?v=579f9252a850e50df69a3da4849537053e1a6f5b";
import {renderModelWorkbench} from "../model-workbench.js?v=579f9252a850e50df69a3da4849537053e1a6f5b";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
