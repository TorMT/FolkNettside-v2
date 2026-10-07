import {extension} from "./utils.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),docx:()=>import("./adapters/office.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),xlsx:()=>import("./adapters/office.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),pptx:()=>import("./adapters/office.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),csv:()=>import("./adapters/csv.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  html:()=>import("./adapters/html.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),htm:()=>import("./adapters/html.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  ipynb:()=>import("./adapters/notebook.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),tex:()=>import("./adapters/latex.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  mp4:()=>import("./adapters/video.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),webm:()=>import("./adapters/video.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),mkv:()=>import("./adapters/video.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  stl:()=>import("./adapters/stl.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),"3mf":()=>import("./adapters/three-mf.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  md:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),txt:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),py:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  js:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),mjs:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),ts:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  tsx:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),jsx:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),json:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  yaml:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),yml:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),c:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  cpp:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),h:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),hpp:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),
  cs:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6"),java:()=>import("./adapters/text.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fe6ae7759a50d9bcf2488bfad6e17c7a5eb909a6");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
