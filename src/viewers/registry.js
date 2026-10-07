import {extension} from "./utils.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),docx:()=>import("./adapters/office.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),xlsx:()=>import("./adapters/office.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),pptx:()=>import("./adapters/office.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),csv:()=>import("./adapters/csv.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  html:()=>import("./adapters/html.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),htm:()=>import("./adapters/html.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  ipynb:()=>import("./adapters/notebook.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),tex:()=>import("./adapters/latex.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  mp4:()=>import("./adapters/video.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),webm:()=>import("./adapters/video.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),mkv:()=>import("./adapters/video.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  stl:()=>import("./adapters/stl.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),"3mf":()=>import("./adapters/three-mf.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  md:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),txt:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),py:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  js:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),mjs:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),ts:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  tsx:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),jsx:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),json:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  yaml:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),yml:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),c:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  cpp:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),h:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),hpp:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),
  cs:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6"),java:()=>import("./adapters/text.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=0d6d070d4ad40d57089981159c6bb61cda4c27e6");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
