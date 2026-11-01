import {parse3MF} from "../../model/parsers/three-mf.js?v=b69e3e03655a6accba2c4903d6e460c0a037e484";
import {renderModelWorkbench} from "../model-workbench.js?v=b69e3e03655a6accba2c4903d6e460c0a037e484";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
