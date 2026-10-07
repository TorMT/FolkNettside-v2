import {extension} from "./utils.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),docx:()=>import("./adapters/office.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),xlsx:()=>import("./adapters/office.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),pptx:()=>import("./adapters/office.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),csv:()=>import("./adapters/csv.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  html:()=>import("./adapters/html.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),htm:()=>import("./adapters/html.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  ipynb:()=>import("./adapters/notebook.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),tex:()=>import("./adapters/latex.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  mp4:()=>import("./adapters/video.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),webm:()=>import("./adapters/video.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),mkv:()=>import("./adapters/video.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  stl:()=>import("./adapters/stl.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),"3mf":()=>import("./adapters/three-mf.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  md:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),txt:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),py:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  js:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),mjs:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),ts:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  tsx:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),jsx:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),json:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  yaml:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),yml:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),c:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  cpp:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),h:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),hpp:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),
  cs:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4"),java:()=>import("./adapters/text.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b9c0af1a4d833d1780a2ae3145fcc5bb411adef4");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
