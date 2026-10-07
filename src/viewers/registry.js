import {extension} from "./utils.js?v=7f81d63463d242e3870c629107545db3e05e4889";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=7f81d63463d242e3870c629107545db3e05e4889"),docx:()=>import("./adapters/office.js?v=7f81d63463d242e3870c629107545db3e05e4889"),xlsx:()=>import("./adapters/office.js?v=7f81d63463d242e3870c629107545db3e05e4889"),pptx:()=>import("./adapters/office.js?v=7f81d63463d242e3870c629107545db3e05e4889"),csv:()=>import("./adapters/csv.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  html:()=>import("./adapters/html.js?v=7f81d63463d242e3870c629107545db3e05e4889"),htm:()=>import("./adapters/html.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  ipynb:()=>import("./adapters/notebook.js?v=7f81d63463d242e3870c629107545db3e05e4889"),tex:()=>import("./adapters/latex.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  mp4:()=>import("./adapters/video.js?v=7f81d63463d242e3870c629107545db3e05e4889"),webm:()=>import("./adapters/video.js?v=7f81d63463d242e3870c629107545db3e05e4889"),mkv:()=>import("./adapters/video.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  stl:()=>import("./adapters/stl.js?v=7f81d63463d242e3870c629107545db3e05e4889"),"3mf":()=>import("./adapters/three-mf.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  md:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),txt:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),py:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  js:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),mjs:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),ts:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  tsx:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),jsx:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),json:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  yaml:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),yml:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),c:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  cpp:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),h:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),hpp:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),
  cs:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889"),java:()=>import("./adapters/text.js?v=7f81d63463d242e3870c629107545db3e05e4889")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=7f81d63463d242e3870c629107545db3e05e4889");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=7f81d63463d242e3870c629107545db3e05e4889");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
