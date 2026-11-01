import {parse3MF} from "../../model/parsers/three-mf.js?v=469b5cda80fe77c01ec0885ac97a54188e276d5f";
import {renderModelWorkbench} from "../model-workbench.js?v=469b5cda80fe77c01ec0885ac97a54188e276d5f";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
