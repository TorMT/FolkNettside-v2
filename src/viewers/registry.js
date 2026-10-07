import {extension} from "./utils.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),docx:()=>import("./adapters/office.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),xlsx:()=>import("./adapters/office.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),pptx:()=>import("./adapters/office.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),csv:()=>import("./adapters/csv.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  html:()=>import("./adapters/html.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),htm:()=>import("./adapters/html.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  ipynb:()=>import("./adapters/notebook.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),tex:()=>import("./adapters/latex.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  mp4:()=>import("./adapters/video.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),webm:()=>import("./adapters/video.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),mkv:()=>import("./adapters/video.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  stl:()=>import("./adapters/stl.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),"3mf":()=>import("./adapters/three-mf.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  md:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),txt:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),py:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  js:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),mjs:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),ts:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  tsx:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),jsx:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),json:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  yaml:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),yml:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),c:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  cpp:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),h:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),hpp:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),
  cs:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5"),java:()=>import("./adapters/text.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fab0e8829da0fe148492b342a9ec29e72cb15bc5");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
