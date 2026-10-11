import {parse3MF} from "../../model/parsers/three-mf.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";
import {renderModelWorkbench} from "../model-workbench.js?v=fff57a90002fdfc1dbd9487a4c3adf2d886a238e";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
