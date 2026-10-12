import {parse3MF} from "../../model/parsers/three-mf.js?v=219793135ebba981835f3ef4debffda2fcc20f69";
import {renderModelWorkbench} from "../model-workbench.js?v=219793135ebba981835f3ef4debffda2fcc20f69";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
