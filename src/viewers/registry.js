import {extension} from "./utils.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),docx:()=>import("./adapters/office.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),xlsx:()=>import("./adapters/office.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),pptx:()=>import("./adapters/office.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),csv:()=>import("./adapters/csv.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  html:()=>import("./adapters/html.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),htm:()=>import("./adapters/html.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  ipynb:()=>import("./adapters/notebook.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),tex:()=>import("./adapters/latex.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  mp4:()=>import("./adapters/video.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),webm:()=>import("./adapters/video.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),mkv:()=>import("./adapters/video.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  stl:()=>import("./adapters/stl.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),"3mf":()=>import("./adapters/three-mf.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  md:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),txt:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),py:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  js:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),mjs:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),ts:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  tsx:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),jsx:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),json:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  yaml:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),yml:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),c:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  cpp:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),h:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),hpp:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),
  cs:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef"),java:()=>import("./adapters/text.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=1968e8e278f661a2a8697c6bfb337e54ff5128ef");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
