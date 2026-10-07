import {extension} from "./utils.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),docx:()=>import("./adapters/office.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),xlsx:()=>import("./adapters/office.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),pptx:()=>import("./adapters/office.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),csv:()=>import("./adapters/csv.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  html:()=>import("./adapters/html.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),htm:()=>import("./adapters/html.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  ipynb:()=>import("./adapters/notebook.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),tex:()=>import("./adapters/latex.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  mp4:()=>import("./adapters/video.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),webm:()=>import("./adapters/video.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),mkv:()=>import("./adapters/video.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  stl:()=>import("./adapters/stl.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),"3mf":()=>import("./adapters/three-mf.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  md:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),txt:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),py:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  js:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),mjs:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),ts:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  tsx:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),jsx:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),json:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  yaml:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),yml:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),c:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  cpp:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),h:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),hpp:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),
  cs:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88"),java:()=>import("./adapters/text.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=7d1a8bab5f6a8bf4b0d1cff94f9476e95533fd88");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
