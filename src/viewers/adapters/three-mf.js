import {parse3MF} from "../../model/parsers/three-mf.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
import {renderModelWorkbench} from "../model-workbench.js?v=8e10534f255b1fd3d7e3f758a6c008585f6340a9";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
