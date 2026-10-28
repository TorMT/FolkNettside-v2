import {parse3MF} from "../../model/parsers/three-mf.js?v=f6a6bcca8acf93bfdac3ac0f44c76dc5b3795187";
import {renderModelWorkbench} from "../model-workbench.js?v=f6a6bcca8acf93bfdac3ac0f44c76dc5b3795187";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
