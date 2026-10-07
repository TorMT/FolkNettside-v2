import {extension} from "./utils.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),docx:()=>import("./adapters/office.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),xlsx:()=>import("./adapters/office.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),pptx:()=>import("./adapters/office.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),csv:()=>import("./adapters/csv.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  html:()=>import("./adapters/html.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),htm:()=>import("./adapters/html.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  ipynb:()=>import("./adapters/notebook.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),tex:()=>import("./adapters/latex.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  mp4:()=>import("./adapters/video.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),webm:()=>import("./adapters/video.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),mkv:()=>import("./adapters/video.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  stl:()=>import("./adapters/stl.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),"3mf":()=>import("./adapters/three-mf.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  md:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),txt:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),py:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  js:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),mjs:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),ts:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  tsx:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),jsx:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),json:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  yaml:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),yml:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),c:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  cpp:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),h:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),hpp:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),
  cs:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd"),java:()=>import("./adapters/text.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=0aba8c960174fa7200b9ea7c1d6018ccc60fb7fd");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
