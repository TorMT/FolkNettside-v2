import {parse3MF} from "../../model/parsers/three-mf.js?v=7d5bc10513001ff4d05f1cb26f5c4cde89bb8fa7";
import {renderModelWorkbench} from "../model-workbench.js?v=7d5bc10513001ff4d05f1cb26f5c4cde89bb8fa7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
