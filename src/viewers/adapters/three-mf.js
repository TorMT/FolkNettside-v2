import {parse3MF} from "../../model/parsers/three-mf.js?v=613f1bf06f03c71e4e3782328409464d1ab91dac";
import {renderModelWorkbench} from "../model-workbench.js?v=613f1bf06f03c71e4e3782328409464d1ab91dac";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
