import {parse3MF} from "../../model/parsers/three-mf.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
import {renderModelWorkbench} from "../model-workbench.js?v=14a9d4ba470b2c648034ccaade17875ed0a07cac";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
