import {parse3MF} from "../../model/parsers/three-mf.js?v=fbff7f8706a833fc7ca800c4248d5e87bdaa9b04";
import {renderModelWorkbench} from "../model-workbench.js?v=fbff7f8706a833fc7ca800c4248d5e87bdaa9b04";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
