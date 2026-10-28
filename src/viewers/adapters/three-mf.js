import {parse3MF} from "../../model/parsers/three-mf.js?v=7aed4fe16527d7b166739c37de3aa7c273d4d5b7";
import {renderModelWorkbench} from "../model-workbench.js?v=7aed4fe16527d7b166739c37de3aa7c273d4d5b7";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
