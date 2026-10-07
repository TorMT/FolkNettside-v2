import {extension} from "./utils.js?v=1d7b19ad95af0e0629853493c00513156a247f75";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),docx:()=>import("./adapters/office.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),xlsx:()=>import("./adapters/office.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),pptx:()=>import("./adapters/office.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),csv:()=>import("./adapters/csv.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  html:()=>import("./adapters/html.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),htm:()=>import("./adapters/html.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  ipynb:()=>import("./adapters/notebook.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),tex:()=>import("./adapters/latex.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  mp4:()=>import("./adapters/video.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),webm:()=>import("./adapters/video.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),mkv:()=>import("./adapters/video.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  stl:()=>import("./adapters/stl.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),"3mf":()=>import("./adapters/three-mf.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  md:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),txt:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),py:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  js:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),mjs:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),ts:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  tsx:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),jsx:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),json:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  yaml:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),yml:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),c:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  cpp:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),h:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),hpp:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),
  cs:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75"),java:()=>import("./adapters/text.js?v=1d7b19ad95af0e0629853493c00513156a247f75")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=1d7b19ad95af0e0629853493c00513156a247f75");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=1d7b19ad95af0e0629853493c00513156a247f75");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
