import {extension} from "./utils.js?v=c4d711984d388bef3791c769968f6ea69188349b";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=c4d711984d388bef3791c769968f6ea69188349b"),docx:()=>import("./adapters/office.js?v=c4d711984d388bef3791c769968f6ea69188349b"),xlsx:()=>import("./adapters/office.js?v=c4d711984d388bef3791c769968f6ea69188349b"),pptx:()=>import("./adapters/office.js?v=c4d711984d388bef3791c769968f6ea69188349b"),csv:()=>import("./adapters/csv.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  html:()=>import("./adapters/html.js?v=c4d711984d388bef3791c769968f6ea69188349b"),htm:()=>import("./adapters/html.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  ipynb:()=>import("./adapters/notebook.js?v=c4d711984d388bef3791c769968f6ea69188349b"),tex:()=>import("./adapters/latex.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  mp4:()=>import("./adapters/video.js?v=c4d711984d388bef3791c769968f6ea69188349b"),webm:()=>import("./adapters/video.js?v=c4d711984d388bef3791c769968f6ea69188349b"),mkv:()=>import("./adapters/video.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  stl:()=>import("./adapters/stl.js?v=c4d711984d388bef3791c769968f6ea69188349b"),"3mf":()=>import("./adapters/three-mf.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  md:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),txt:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),py:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  js:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),mjs:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),ts:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  tsx:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),jsx:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),json:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  yaml:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),yml:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),c:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  cpp:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),h:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),hpp:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),
  cs:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b"),java:()=>import("./adapters/text.js?v=c4d711984d388bef3791c769968f6ea69188349b")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=c4d711984d388bef3791c769968f6ea69188349b");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=c4d711984d388bef3791c769968f6ea69188349b");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
