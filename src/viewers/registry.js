import {extension} from "./utils.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),docx:()=>import("./adapters/office.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),xlsx:()=>import("./adapters/office.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),pptx:()=>import("./adapters/office.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),csv:()=>import("./adapters/csv.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  html:()=>import("./adapters/html.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),htm:()=>import("./adapters/html.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  ipynb:()=>import("./adapters/notebook.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),tex:()=>import("./adapters/latex.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  mp4:()=>import("./adapters/video.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),webm:()=>import("./adapters/video.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),mkv:()=>import("./adapters/video.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  stl:()=>import("./adapters/stl.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),"3mf":()=>import("./adapters/three-mf.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  md:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),txt:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),py:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  js:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),mjs:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),ts:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  tsx:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),jsx:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),json:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  yaml:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),yml:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),c:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  cpp:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),h:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),hpp:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),
  cs:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c"),java:()=>import("./adapters/text.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=34a76fa874f6edaaa9b852eb7247f8bbbc8e686c");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
