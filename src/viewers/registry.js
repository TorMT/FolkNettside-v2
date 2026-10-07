import {extension} from "./utils.js?v=6587bb4ed25b33179807200086964f7234283bef";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=6587bb4ed25b33179807200086964f7234283bef"),docx:()=>import("./adapters/office.js?v=6587bb4ed25b33179807200086964f7234283bef"),xlsx:()=>import("./adapters/office.js?v=6587bb4ed25b33179807200086964f7234283bef"),pptx:()=>import("./adapters/office.js?v=6587bb4ed25b33179807200086964f7234283bef"),csv:()=>import("./adapters/csv.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  html:()=>import("./adapters/html.js?v=6587bb4ed25b33179807200086964f7234283bef"),htm:()=>import("./adapters/html.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  ipynb:()=>import("./adapters/notebook.js?v=6587bb4ed25b33179807200086964f7234283bef"),tex:()=>import("./adapters/latex.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  mp4:()=>import("./adapters/video.js?v=6587bb4ed25b33179807200086964f7234283bef"),webm:()=>import("./adapters/video.js?v=6587bb4ed25b33179807200086964f7234283bef"),mkv:()=>import("./adapters/video.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  stl:()=>import("./adapters/stl.js?v=6587bb4ed25b33179807200086964f7234283bef"),"3mf":()=>import("./adapters/three-mf.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  md:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),txt:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),py:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  js:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),mjs:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),ts:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  tsx:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),jsx:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),json:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  yaml:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),yml:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),c:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  cpp:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),h:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),hpp:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),
  cs:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef"),java:()=>import("./adapters/text.js?v=6587bb4ed25b33179807200086964f7234283bef")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=6587bb4ed25b33179807200086964f7234283bef");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=6587bb4ed25b33179807200086964f7234283bef");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
