import {extension} from "./utils.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),docx:()=>import("./adapters/office.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),xlsx:()=>import("./adapters/office.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),pptx:()=>import("./adapters/office.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),csv:()=>import("./adapters/csv.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  html:()=>import("./adapters/html.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),htm:()=>import("./adapters/html.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  ipynb:()=>import("./adapters/notebook.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),tex:()=>import("./adapters/latex.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  mp4:()=>import("./adapters/video.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),webm:()=>import("./adapters/video.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),mkv:()=>import("./adapters/video.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  stl:()=>import("./adapters/stl.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),"3mf":()=>import("./adapters/three-mf.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  md:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),txt:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),py:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  js:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),mjs:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),ts:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  tsx:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),jsx:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),json:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  yaml:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),yml:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),c:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  cpp:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),h:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),hpp:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),
  cs:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847"),java:()=>import("./adapters/text.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=aedd12f368fbce9ad01a49fc207bb630d5959847");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
