import {extension} from "./utils.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),docx:()=>import("./adapters/office.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),xlsx:()=>import("./adapters/office.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),pptx:()=>import("./adapters/office.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),csv:()=>import("./adapters/csv.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  html:()=>import("./adapters/html.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),htm:()=>import("./adapters/html.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  ipynb:()=>import("./adapters/notebook.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),tex:()=>import("./adapters/latex.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  mp4:()=>import("./adapters/video.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),webm:()=>import("./adapters/video.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),mkv:()=>import("./adapters/video.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  stl:()=>import("./adapters/stl.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),"3mf":()=>import("./adapters/three-mf.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  md:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),txt:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),py:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  js:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),mjs:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),ts:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  tsx:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),jsx:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),json:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  yaml:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),yml:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),c:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  cpp:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),h:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),hpp:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),
  cs:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4"),java:()=>import("./adapters/text.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=1793abea10f9cca1f3354f6ec9c14feebaa6bac4");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
