import {extension} from "./utils.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),docx:()=>import("./adapters/office.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),xlsx:()=>import("./adapters/office.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),pptx:()=>import("./adapters/office.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),csv:()=>import("./adapters/csv.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  html:()=>import("./adapters/html.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),htm:()=>import("./adapters/html.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  ipynb:()=>import("./adapters/notebook.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),tex:()=>import("./adapters/latex.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  mp4:()=>import("./adapters/video.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),webm:()=>import("./adapters/video.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),mkv:()=>import("./adapters/video.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  stl:()=>import("./adapters/stl.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),"3mf":()=>import("./adapters/three-mf.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  md:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),txt:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),py:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  js:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),mjs:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),ts:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  tsx:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),jsx:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),json:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  yaml:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),yml:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),c:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  cpp:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),h:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),hpp:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),
  cs:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f"),java:()=>import("./adapters/text.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=0d0ab8c80faf9cbe25c501977a4ae78255b6379f");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
