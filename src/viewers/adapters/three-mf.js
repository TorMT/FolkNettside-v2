import {parse3MF} from "../../model/parsers/three-mf.js?v=7b269b6c1fa8fddb4255af2c8b9fe83df8d89336";
import {renderModelWorkbench} from "../model-workbench.js?v=7b269b6c1fa8fddb4255af2c8b9fe83df8d89336";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
