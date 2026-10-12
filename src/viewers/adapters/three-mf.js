import {parse3MF} from "../../model/parsers/three-mf.js?v=22e449b5fc14d5359fcf656ff4e1a9357d400dcb";
import {renderModelWorkbench} from "../model-workbench.js?v=22e449b5fc14d5359fcf656ff4e1a9357d400dcb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
