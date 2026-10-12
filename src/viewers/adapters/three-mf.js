import {parse3MF} from "../../model/parsers/three-mf.js?v=586f5f8583e1958aed309d5fa3d5b9bfda6f50d6";
import {renderModelWorkbench} from "../model-workbench.js?v=586f5f8583e1958aed309d5fa3d5b9bfda6f50d6";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
