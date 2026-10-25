import {parse3MF} from "../../model/parsers/three-mf.js?v=aa46850cd6e1cef2efc06d8ca84aa80e800c63d1";
import {renderModelWorkbench} from "../model-workbench.js?v=aa46850cd6e1cef2efc06d8ca84aa80e800c63d1";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
