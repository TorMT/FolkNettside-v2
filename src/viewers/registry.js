import {extension} from "./utils.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),docx:()=>import("./adapters/office.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),xlsx:()=>import("./adapters/office.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),pptx:()=>import("./adapters/office.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),csv:()=>import("./adapters/csv.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  html:()=>import("./adapters/html.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),htm:()=>import("./adapters/html.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  ipynb:()=>import("./adapters/notebook.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),tex:()=>import("./adapters/latex.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  mp4:()=>import("./adapters/video.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),webm:()=>import("./adapters/video.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),mkv:()=>import("./adapters/video.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  stl:()=>import("./adapters/stl.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),"3mf":()=>import("./adapters/three-mf.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  md:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),txt:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),py:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  js:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),mjs:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),ts:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  tsx:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),jsx:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),json:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  yaml:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),yml:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),c:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  cpp:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),h:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),hpp:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),
  cs:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9"),java:()=>import("./adapters/text.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=265bfc29198bb03040739f1a09ecc8a5ec4f71d9");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
