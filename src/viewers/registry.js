import {extension} from "./utils.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),docx:()=>import("./adapters/office.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),xlsx:()=>import("./adapters/office.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),pptx:()=>import("./adapters/office.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),csv:()=>import("./adapters/csv.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  html:()=>import("./adapters/html.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),htm:()=>import("./adapters/html.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  ipynb:()=>import("./adapters/notebook.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),tex:()=>import("./adapters/latex.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  mp4:()=>import("./adapters/video.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),webm:()=>import("./adapters/video.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),mkv:()=>import("./adapters/video.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  stl:()=>import("./adapters/stl.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),"3mf":()=>import("./adapters/three-mf.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  md:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),txt:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),py:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  js:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),mjs:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),ts:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  tsx:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),jsx:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),json:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  yaml:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),yml:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),c:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  cpp:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),h:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),hpp:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),
  cs:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1"),java:()=>import("./adapters/text.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=3e5e6b1c0a328e6d3af2beb473242e3324a0e0c1");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
