import {parse3MF} from "../../model/parsers/three-mf.js?v=44d6ae2823eb8c178ddddc808cb9f5f49befe266";
import {renderModelWorkbench} from "../model-workbench.js?v=44d6ae2823eb8c178ddddc808cb9f5f49befe266";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
