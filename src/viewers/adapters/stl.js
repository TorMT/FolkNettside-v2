import {parseSTL} from "../../model/parsers/stl.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";
import {renderModelWorkbench} from "../model-workbench.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=parseSTL(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
