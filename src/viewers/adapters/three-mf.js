import {parse3MF} from "../../model/parsers/three-mf.js?v=e68efebf91d8678aeef9244501fc709acb0bb3e2";
import {renderModelWorkbench} from "../model-workbench.js?v=e68efebf91d8678aeef9244501fc709acb0bb3e2";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
