import {parse3MF} from "../../model/parsers/three-mf.js?v=d97324820154988db8a9dbe762b2f04ca65b6ad9";
import {renderModelWorkbench} from "../model-workbench.js?v=d97324820154988db8a9dbe762b2f04ca65b6ad9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
