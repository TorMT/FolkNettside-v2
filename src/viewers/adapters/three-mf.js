import {parse3MF} from "../../model/parsers/three-mf.js?v=520fc612140469f3fd3baf73d69bf0fca2dc4fec";
import {renderModelWorkbench} from "../model-workbench.js?v=520fc612140469f3fd3baf73d69bf0fca2dc4fec";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
