import {extension} from "./utils.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),docx:()=>import("./adapters/office.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),xlsx:()=>import("./adapters/office.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),pptx:()=>import("./adapters/office.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),csv:()=>import("./adapters/csv.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  html:()=>import("./adapters/html.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),htm:()=>import("./adapters/html.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  ipynb:()=>import("./adapters/notebook.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),tex:()=>import("./adapters/latex.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  mp4:()=>import("./adapters/video.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),webm:()=>import("./adapters/video.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),mkv:()=>import("./adapters/video.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  stl:()=>import("./adapters/stl.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),"3mf":()=>import("./adapters/three-mf.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  md:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),txt:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),py:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  js:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),mjs:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),ts:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  tsx:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),jsx:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),json:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  yaml:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),yml:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),c:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  cpp:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),h:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),hpp:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),
  cs:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6"),java:()=>import("./adapters/text.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=3c539a7465792e092560a6e49b4ddab262f3a9b6");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
