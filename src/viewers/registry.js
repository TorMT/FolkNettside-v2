import {extension} from "./utils.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),docx:()=>import("./adapters/office.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),xlsx:()=>import("./adapters/office.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),pptx:()=>import("./adapters/office.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),csv:()=>import("./adapters/csv.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  html:()=>import("./adapters/html.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),htm:()=>import("./adapters/html.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  ipynb:()=>import("./adapters/notebook.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),tex:()=>import("./adapters/latex.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  mp4:()=>import("./adapters/video.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),webm:()=>import("./adapters/video.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),mkv:()=>import("./adapters/video.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  stl:()=>import("./adapters/stl.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),"3mf":()=>import("./adapters/three-mf.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  md:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),txt:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),py:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  js:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),mjs:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),ts:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  tsx:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),jsx:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),json:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  yaml:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),yml:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),c:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  cpp:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),h:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),hpp:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),
  cs:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8"),java:()=>import("./adapters/text.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=37723afc675aaf728ff7a8c03cce840125c0b6a8");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
