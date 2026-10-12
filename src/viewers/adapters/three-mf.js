import {parse3MF} from "../../model/parsers/three-mf.js?v=9c87cf0caf161ebf6354780cfd49f68f6a66cd7e";
import {renderModelWorkbench} from "../model-workbench.js?v=9c87cf0caf161ebf6354780cfd49f68f6a66cd7e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
