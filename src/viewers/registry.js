import {extension} from "./utils.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),docx:()=>import("./adapters/office.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),xlsx:()=>import("./adapters/office.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),pptx:()=>import("./adapters/office.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),csv:()=>import("./adapters/csv.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  html:()=>import("./adapters/html.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),htm:()=>import("./adapters/html.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  ipynb:()=>import("./adapters/notebook.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),tex:()=>import("./adapters/latex.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  mp4:()=>import("./adapters/video.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),webm:()=>import("./adapters/video.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),mkv:()=>import("./adapters/video.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  stl:()=>import("./adapters/stl.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),"3mf":()=>import("./adapters/three-mf.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  md:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),txt:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),py:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  js:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),mjs:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),ts:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  tsx:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),jsx:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),json:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  yaml:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),yml:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),c:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  cpp:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),h:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),hpp:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),
  cs:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a"),java:()=>import("./adapters/text.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fede50374fe950b524a1e82c155e425f8cc81d1a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
