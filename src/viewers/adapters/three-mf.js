import {parse3MF} from "../../model/parsers/three-mf.js?v=db5bf784739ac272a4672058d9fcff9f30514a05";
import {renderModelWorkbench} from "../model-workbench.js?v=db5bf784739ac272a4672058d9fcff9f30514a05";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
