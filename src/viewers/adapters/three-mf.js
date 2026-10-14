import {parse3MF} from "../../model/parsers/three-mf.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
import {renderModelWorkbench} from "../model-workbench.js?v=bcbda2770f311c5ecf06e6b0fcbdc44951da6c2e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
