import {parse3MF} from "../../model/parsers/three-mf.js?v=79b5d8681aa2894aaa520e68ce480d4aca258feb";
import {renderModelWorkbench} from "../model-workbench.js?v=79b5d8681aa2894aaa520e68ce480d4aca258feb";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
