import {parse3MF} from "../../model/parsers/three-mf.js?v=09814fa18005854a7a30f680db55df32e29e8bf7";
import {renderModelWorkbench} from "../model-workbench.js?v=09814fa18005854a7a30f680db55df32e29e8bf7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
