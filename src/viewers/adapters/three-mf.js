import {parse3MF} from "../../model/parsers/three-mf.js?v=dbe1e7f8e3bd426bd033df83ff057485649de1cc";
import {renderModelWorkbench} from "../model-workbench.js?v=dbe1e7f8e3bd426bd033df83ff057485649de1cc";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
