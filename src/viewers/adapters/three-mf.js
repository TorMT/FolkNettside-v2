import {parse3MF} from "../../model/parsers/three-mf.js?v=a01eb8a30ccba0ffa8d276a242b5128369b612e4";
import {renderModelWorkbench} from "../model-workbench.js?v=a01eb8a30ccba0ffa8d276a242b5128369b612e4";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
