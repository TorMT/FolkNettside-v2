import {extension} from "./utils.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),docx:()=>import("./adapters/office.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),xlsx:()=>import("./adapters/office.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),pptx:()=>import("./adapters/office.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),csv:()=>import("./adapters/csv.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  html:()=>import("./adapters/html.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),htm:()=>import("./adapters/html.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  ipynb:()=>import("./adapters/notebook.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),tex:()=>import("./adapters/latex.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  mp4:()=>import("./adapters/video.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),webm:()=>import("./adapters/video.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),mkv:()=>import("./adapters/video.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  stl:()=>import("./adapters/stl.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),"3mf":()=>import("./adapters/three-mf.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  md:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),txt:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),py:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  js:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),mjs:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),ts:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  tsx:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),jsx:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),json:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  yaml:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),yml:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),c:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  cpp:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),h:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),hpp:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),
  cs:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8"),java:()=>import("./adapters/text.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=38692008f4206b65c9aa67d2ae3baae54773d1b8");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
