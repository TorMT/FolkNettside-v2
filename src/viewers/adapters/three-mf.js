import {parse3MF} from "../../model/parsers/three-mf.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";
import {renderModelWorkbench} from "../model-workbench.js?v=2431dc69726b5ee070d346ec2eaba1196510df35";
export async function render(container,resource){
  const response=await fetch(resource.path);if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const model=await parse3MF(await response.arrayBuffer(),resource.label||resource.name);
  return renderModelWorkbench(container,model);
}
