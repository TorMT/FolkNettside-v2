import {extension} from "./utils.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),docx:()=>import("./adapters/office.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),xlsx:()=>import("./adapters/office.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),pptx:()=>import("./adapters/office.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),csv:()=>import("./adapters/csv.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  html:()=>import("./adapters/html.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),htm:()=>import("./adapters/html.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  ipynb:()=>import("./adapters/notebook.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),tex:()=>import("./adapters/latex.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  mp4:()=>import("./adapters/video.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),webm:()=>import("./adapters/video.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),mkv:()=>import("./adapters/video.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  stl:()=>import("./adapters/stl.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),"3mf":()=>import("./adapters/three-mf.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  md:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),txt:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),py:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  js:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),mjs:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),ts:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  tsx:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),jsx:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),json:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  yaml:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),yml:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),c:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  cpp:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),h:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),hpp:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),
  cs:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb"),java:()=>import("./adapters/text.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=d40d94be989a292cf353b1b096cb4ff8d8459cbb");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
