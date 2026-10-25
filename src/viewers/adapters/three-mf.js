import {parse3MF} from "../../model/parsers/three-mf.js?v=ca90c93a141b468461ed11407264dbaf388adb6d";
import {renderModelWorkbench} from "../model-workbench.js?v=ca90c93a141b468461ed11407264dbaf388adb6d";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
