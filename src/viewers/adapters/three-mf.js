import {parse3MF} from "../../model/parsers/three-mf.js?v=6c4cc3557b13b5654450274a995d12c977c89852";
import {renderModelWorkbench} from "../model-workbench.js?v=6c4cc3557b13b5654450274a995d12c977c89852";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
