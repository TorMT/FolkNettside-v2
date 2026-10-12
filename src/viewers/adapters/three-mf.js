import {parse3MF} from "../../model/parsers/three-mf.js?v=7ab27b1cea88b94f4c586c9b1fd9d1305bcf2dc7";
import {renderModelWorkbench} from "../model-workbench.js?v=7ab27b1cea88b94f4c586c9b1fd9d1305bcf2dc7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
