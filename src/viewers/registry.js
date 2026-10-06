import {extension} from "./utils.js";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js"),docx:()=>import("./adapters/office.js"),xlsx:()=>import("./adapters/office.js"),pptx:()=>import("./adapters/office.js"),csv:()=>import("./adapters/csv.js"),
  html:()=>import("./adapters/html.js"),htm:()=>import("./adapters/html.js"),
  ipynb:()=>import("./adapters/notebook.js"),tex:()=>import("./adapters/latex.js"),
  mp4:()=>import("./adapters/video.js"),webm:()=>import("./adapters/video.js"),mkv:()=>import("./adapters/video.js"),
  stl:()=>import("./adapters/stl.js"),"3mf":()=>import("./adapters/three-mf.js"),
  md:()=>import("./adapters/text.js"),txt:()=>import("./adapters/text.js"),py:()=>import("./adapters/text.js"),
  js:()=>import("./adapters/text.js"),mjs:()=>import("./adapters/text.js"),ts:()=>import("./adapters/text.js"),
  tsx:()=>import("./adapters/text.js"),jsx:()=>import("./adapters/text.js"),json:()=>import("./adapters/text.js"),
  yaml:()=>import("./adapters/text.js"),yml:()=>import("./adapters/text.js"),c:()=>import("./adapters/text.js"),
  cpp:()=>import("./adapters/text.js"),h:()=>import("./adapters/text.js"),hpp:()=>import("./adapters/text.js"),
  cs:()=>import("./adapters/text.js"),java:()=>import("./adapters/text.js")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
