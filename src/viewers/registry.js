import {extension} from "./utils.js?v=510af458c226b1733e776f322333b3484e2c8c72";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=510af458c226b1733e776f322333b3484e2c8c72"),docx:()=>import("./adapters/office.js?v=510af458c226b1733e776f322333b3484e2c8c72"),xlsx:()=>import("./adapters/office.js?v=510af458c226b1733e776f322333b3484e2c8c72"),pptx:()=>import("./adapters/office.js?v=510af458c226b1733e776f322333b3484e2c8c72"),csv:()=>import("./adapters/csv.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  html:()=>import("./adapters/html.js?v=510af458c226b1733e776f322333b3484e2c8c72"),htm:()=>import("./adapters/html.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  ipynb:()=>import("./adapters/notebook.js?v=510af458c226b1733e776f322333b3484e2c8c72"),tex:()=>import("./adapters/latex.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  mp4:()=>import("./adapters/video.js?v=510af458c226b1733e776f322333b3484e2c8c72"),webm:()=>import("./adapters/video.js?v=510af458c226b1733e776f322333b3484e2c8c72"),mkv:()=>import("./adapters/video.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  stl:()=>import("./adapters/stl.js?v=510af458c226b1733e776f322333b3484e2c8c72"),"3mf":()=>import("./adapters/three-mf.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  md:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),txt:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),py:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  js:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),mjs:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),ts:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  tsx:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),jsx:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),json:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  yaml:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),yml:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),c:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  cpp:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),h:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),hpp:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),
  cs:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72"),java:()=>import("./adapters/text.js?v=510af458c226b1733e776f322333b3484e2c8c72")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=510af458c226b1733e776f322333b3484e2c8c72");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=510af458c226b1733e776f322333b3484e2c8c72");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
