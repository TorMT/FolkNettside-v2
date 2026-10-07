import {extension} from "./utils.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),docx:()=>import("./adapters/office.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),xlsx:()=>import("./adapters/office.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),pptx:()=>import("./adapters/office.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),csv:()=>import("./adapters/csv.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  html:()=>import("./adapters/html.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),htm:()=>import("./adapters/html.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  ipynb:()=>import("./adapters/notebook.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),tex:()=>import("./adapters/latex.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  mp4:()=>import("./adapters/video.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),webm:()=>import("./adapters/video.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),mkv:()=>import("./adapters/video.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  stl:()=>import("./adapters/stl.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),"3mf":()=>import("./adapters/three-mf.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  md:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),txt:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),py:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  js:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),mjs:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),ts:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  tsx:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),jsx:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),json:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  yaml:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),yml:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),c:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  cpp:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),h:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),hpp:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),
  cs:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0"),java:()=>import("./adapters/text.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=d3a1e51c177a56990f1459c681a0f2bfb4e0b3c0");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
