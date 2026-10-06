import {extension} from "./utils.js?v=2679c75179d890c7b8dca577d8f4a170607682bd";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),docx:()=>import("./adapters/office.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),xlsx:()=>import("./adapters/office.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),pptx:()=>import("./adapters/office.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),csv:()=>import("./adapters/csv.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  html:()=>import("./adapters/html.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),htm:()=>import("./adapters/html.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  ipynb:()=>import("./adapters/notebook.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),tex:()=>import("./adapters/latex.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  mp4:()=>import("./adapters/video.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),webm:()=>import("./adapters/video.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),mkv:()=>import("./adapters/video.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  stl:()=>import("./adapters/stl.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),"3mf":()=>import("./adapters/three-mf.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  md:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),txt:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),py:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  js:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),mjs:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),ts:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  tsx:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),jsx:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),json:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  yaml:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),yml:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),c:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  cpp:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),h:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),hpp:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),
  cs:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd"),java:()=>import("./adapters/text.js?v=2679c75179d890c7b8dca577d8f4a170607682bd")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=2679c75179d890c7b8dca577d8f4a170607682bd");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=2679c75179d890c7b8dca577d8f4a170607682bd");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
