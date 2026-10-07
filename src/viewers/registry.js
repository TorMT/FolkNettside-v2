import {extension} from "./utils.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),docx:()=>import("./adapters/office.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),xlsx:()=>import("./adapters/office.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),pptx:()=>import("./adapters/office.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),csv:()=>import("./adapters/csv.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  html:()=>import("./adapters/html.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),htm:()=>import("./adapters/html.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  ipynb:()=>import("./adapters/notebook.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),tex:()=>import("./adapters/latex.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  mp4:()=>import("./adapters/video.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),webm:()=>import("./adapters/video.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),mkv:()=>import("./adapters/video.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  stl:()=>import("./adapters/stl.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),"3mf":()=>import("./adapters/three-mf.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  md:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),txt:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),py:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  js:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),mjs:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),ts:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  tsx:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),jsx:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),json:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  yaml:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),yml:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),c:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  cpp:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),h:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),hpp:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),
  cs:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a"),java:()=>import("./adapters/text.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=27a0fb06f71c8133a9653948797dba9f1a98a00a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
