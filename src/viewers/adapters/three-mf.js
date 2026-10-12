import {parse3MF} from "../../model/parsers/three-mf.js?v=795e5702f951a9c3ed3228548828ba9698badba1";
import {renderModelWorkbench} from "../model-workbench.js?v=795e5702f951a9c3ed3228548828ba9698badba1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
