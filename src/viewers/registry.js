import {extension} from "./utils.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),docx:()=>import("./adapters/office.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),xlsx:()=>import("./adapters/office.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),pptx:()=>import("./adapters/office.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),csv:()=>import("./adapters/csv.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  html:()=>import("./adapters/html.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),htm:()=>import("./adapters/html.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  ipynb:()=>import("./adapters/notebook.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),tex:()=>import("./adapters/latex.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  mp4:()=>import("./adapters/video.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),webm:()=>import("./adapters/video.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),mkv:()=>import("./adapters/video.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  stl:()=>import("./adapters/stl.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),"3mf":()=>import("./adapters/three-mf.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  md:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),txt:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),py:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  js:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),mjs:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),ts:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  tsx:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),jsx:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),json:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  yaml:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),yml:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),c:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  cpp:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),h:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),hpp:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),
  cs:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83"),java:()=>import("./adapters/text.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=de165a6236215eb46d3b396765f5f88ba9e35a83");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
