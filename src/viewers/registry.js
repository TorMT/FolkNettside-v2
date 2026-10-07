import {extension} from "./utils.js?v=d106ea86f48645e34739613dfedefbaa817698fb";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),docx:()=>import("./adapters/office.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),xlsx:()=>import("./adapters/office.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),pptx:()=>import("./adapters/office.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),csv:()=>import("./adapters/csv.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  html:()=>import("./adapters/html.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),htm:()=>import("./adapters/html.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  ipynb:()=>import("./adapters/notebook.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),tex:()=>import("./adapters/latex.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  mp4:()=>import("./adapters/video.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),webm:()=>import("./adapters/video.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),mkv:()=>import("./adapters/video.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  stl:()=>import("./adapters/stl.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),"3mf":()=>import("./adapters/three-mf.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  md:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),txt:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),py:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  js:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),mjs:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),ts:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  tsx:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),jsx:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),json:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  yaml:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),yml:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),c:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  cpp:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),h:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),hpp:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),
  cs:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb"),java:()=>import("./adapters/text.js?v=d106ea86f48645e34739613dfedefbaa817698fb")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=d106ea86f48645e34739613dfedefbaa817698fb");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=d106ea86f48645e34739613dfedefbaa817698fb");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
