import {extension} from "./utils.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),docx:()=>import("./adapters/office.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),xlsx:()=>import("./adapters/office.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),pptx:()=>import("./adapters/office.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),csv:()=>import("./adapters/csv.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  html:()=>import("./adapters/html.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),htm:()=>import("./adapters/html.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  ipynb:()=>import("./adapters/notebook.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),tex:()=>import("./adapters/latex.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  mp4:()=>import("./adapters/video.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),webm:()=>import("./adapters/video.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),mkv:()=>import("./adapters/video.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  stl:()=>import("./adapters/stl.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),"3mf":()=>import("./adapters/three-mf.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  md:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),txt:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),py:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  js:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),mjs:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),ts:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  tsx:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),jsx:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),json:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  yaml:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),yml:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),c:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  cpp:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),h:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),hpp:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),
  cs:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e"),java:()=>import("./adapters/text.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=45d683c4f79c842373f0f39292dbfea7076dc49e");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
