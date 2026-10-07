import {extension} from "./utils.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),docx:()=>import("./adapters/office.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),xlsx:()=>import("./adapters/office.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),pptx:()=>import("./adapters/office.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),csv:()=>import("./adapters/csv.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  html:()=>import("./adapters/html.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),htm:()=>import("./adapters/html.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  ipynb:()=>import("./adapters/notebook.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),tex:()=>import("./adapters/latex.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  mp4:()=>import("./adapters/video.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),webm:()=>import("./adapters/video.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),mkv:()=>import("./adapters/video.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  stl:()=>import("./adapters/stl.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),"3mf":()=>import("./adapters/three-mf.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  md:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),txt:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),py:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  js:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),mjs:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),ts:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  tsx:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),jsx:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),json:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  yaml:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),yml:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),c:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  cpp:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),h:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),hpp:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),
  cs:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6"),java:()=>import("./adapters/text.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=c051aa2a3133e01c8d84869ab38e0b81f31960e6");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
