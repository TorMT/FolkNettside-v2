import {parseFusionArchive,FusionConversionRequiredError} from "../../model/parsers/fusion-archive.js?v=c8321a3bee675387a645129059471c24e3f49f03";
import {renderModelWorkbench} from "../model-workbench.js?v=c8321a3bee675387a645129059471c24e3f49f03";
import {extension} from "../utils.js?v=c8321a3bee675387a645129059471c24e3f49f03";

function conversionNotice(container,resource,reason){
  const shell=document.createElement("section");shell.className="viewer-conversion-required";
  const headline=document.createElement("h2");
  headline.textContent="CAD conversion required";
  const description=document.createElement("p");
  description.textContent=String(reason||"The original Fusion geometry needs APS conversion. This viewer will not invent geometry.");
  const detail=document.createElement("p");detail.textContent="Native F3D is not triangulated model data. F3Z is previewable when its archive contains an embedded 3MF or STL. Export a 3MF/STL from Fusion to enable local viewing.";
  const link=document.createElement("a");link.className="btn";
  link.textContent="Open original CAD file";link.href=resource.url||resource.path;
  link.target="_blank";link.rel="noopener noreferrer";
  shell.append(headline,description,detail,link);container.replaceChildren(shell);
  return {info:"CAD source · APS conversion required"};
}
export async function render(container,resource){
  const format=extension(resource.path||resource.url);
  if(format!=="f3z"&&format!=="f3d")
    return conversionNotice(container,resource,"This CAD format needs a supported neutral mesh export.");
  if(format==="f3d")
    return conversionNotice(container,resource,"Native F3D cannot be parsed directly in the browser.");
  const response=await fetch(resource.path||resource.url);
  if(!response.ok)throw new Error("CAD HTTP "+response.status);
  try{
    const model=await parseFusionArchive(await response.arrayBuffer(),resource.label||resource.name);
    const rendered=await renderModelWorkbench(container,model);
    return {...rendered,info:"F3Z · embedded "+model.source.embeddedFormat+" geometry · "+
      (rendered?.info||"interactive ModelDocument")};
  }catch(error){
    if(error?.code!=="APS_REQUIRED")throw error;
    return conversionNotice(container,resource,error.message);
  }
}
