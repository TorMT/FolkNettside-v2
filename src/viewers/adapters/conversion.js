import {extension,escapeHTML} from "../utils.js?v=378e192972d27ddaafe3f143f6db13b0a140e4c5";
export const formatGuidance=ext=>{
 const e=String(ext).toLowerCase();
 if(["step","stp","iges","igs","sat","x_t","x_b","sldprt","sldasm","ipt","iam","catpart","catproduct","fbm","blend","skp","dwg","dxf"].includes(e))
   return "Native CAD/B-rep files require a tessellation/export step in CAD software or Autodesk APS before they can become an accurate 3D mesh. Export STL/3MF for local visualization; the original geometry must be checked before Hydro analysis.";
 if(["doc","xls","ppt","odt","ods","odp","pages","numbers","key"].includes(e))
   return "This document format cannot be safely converted in the browser. Export to PDF, DOCX, XLSX or PPTX for a native preview. Macros and editing are not executed.";
 if(["heic","heif"].includes(e))
   return "HEIC/HEIF decoding is not consistent across browsers. Export a JPEG or PNG image for reliable inline viewing.";
 return "This format requires conversion before it can be previewed in the browser.";
};
export async function render(container,resource){
 const ext=extension(resource.path||resource.url||resource.name||""),path=resource.url||resource.path;
 container.innerHTML=`<section class="viewer-conversion-required">
   <h2>${escapeHTML(ext.toUpperCase()||"File")} · conversion required</h2>
   <p>${escapeHTML(formatGuidance(ext))}</p>
   <p>No geometry or contents have been inferred from this file.</p>
   ${path?`<a class="btn" href="${escapeHTML(path)}" download>Download original file</a>`:""}
 </section>`;
 return {info:`${ext.toUpperCase()} · conversion required`};
}
