import {parse3MF} from "../../model/parsers/three-mf.js?v=50c68e9814ca75ca5044d7ab96c2b875b9e950a2";
import {renderModelWorkbench} from "../model-workbench.js?v=50c68e9814ca75ca5044d7ab96c2b875b9e950a2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
