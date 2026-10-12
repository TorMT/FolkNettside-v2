import {parse3MF} from "../../model/parsers/three-mf.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
import {renderModelWorkbench} from "../model-workbench.js?v=f43c64dc23d4f9c4ea33c44599f732ad61d1ed78";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
