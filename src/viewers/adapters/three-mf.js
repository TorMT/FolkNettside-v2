import {parse3MF} from "../../model/parsers/three-mf.js?v=89a7630076656c764fe964fbb16ec5499057a23c";
import {renderModelWorkbench} from "../model-workbench.js?v=89a7630076656c764fe964fbb16ec5499057a23c";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
