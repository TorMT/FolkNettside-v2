import {parse3MF} from "../../model/parsers/three-mf.js?v=3a4cd95f7288d9435cba44f682313d690fae8a49";
import {renderModelWorkbench} from "../model-workbench.js?v=3a4cd95f7288d9435cba44f682313d690fae8a49";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
