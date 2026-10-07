import {extension} from "./utils.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),docx:()=>import("./adapters/office.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),xlsx:()=>import("./adapters/office.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),pptx:()=>import("./adapters/office.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),csv:()=>import("./adapters/csv.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  html:()=>import("./adapters/html.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),htm:()=>import("./adapters/html.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  ipynb:()=>import("./adapters/notebook.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),tex:()=>import("./adapters/latex.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  mp4:()=>import("./adapters/video.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),webm:()=>import("./adapters/video.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),mkv:()=>import("./adapters/video.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  stl:()=>import("./adapters/stl.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),"3mf":()=>import("./adapters/three-mf.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  md:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),txt:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),py:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  js:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),mjs:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),ts:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  tsx:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),jsx:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),json:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  yaml:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),yml:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),c:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  cpp:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),h:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),hpp:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),
  cs:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d"),java:()=>import("./adapters/text.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=8dcf3d7c6b9c4b0a0379a7bd0104f2d22c90e32d");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
