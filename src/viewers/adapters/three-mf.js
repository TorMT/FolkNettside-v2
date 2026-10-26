import {parse3MF} from "../../model/parsers/three-mf.js?v=fab548193bd6e3df78c5033a3e7cfe010a9752e8";
import {renderModelWorkbench} from "../model-workbench.js?v=fab548193bd6e3df78c5033a3e7cfe010a9752e8";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
