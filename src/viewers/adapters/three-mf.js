import {parse3MF} from "../../model/parsers/three-mf.js?v=36a66d74845a0e219347125577c997c97c9617ac";
import {renderModelWorkbench} from "../model-workbench.js?v=36a66d74845a0e219347125577c997c97c9617ac";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
