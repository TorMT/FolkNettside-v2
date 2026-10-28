import {parse3MF} from "../../model/parsers/three-mf.js?v=ff51b5daa35664ca28a23c24f1a3361797476be3";
import {renderModelWorkbench} from "../model-workbench.js?v=ff51b5daa35664ca28a23c24f1a3361797476be3";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
