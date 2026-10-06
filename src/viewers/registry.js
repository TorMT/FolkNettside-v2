import {extension} from "./utils.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),docx:()=>import("./adapters/office.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),xlsx:()=>import("./adapters/office.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),pptx:()=>import("./adapters/office.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),csv:()=>import("./adapters/csv.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  html:()=>import("./adapters/html.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),htm:()=>import("./adapters/html.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  ipynb:()=>import("./adapters/notebook.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),tex:()=>import("./adapters/latex.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  mp4:()=>import("./adapters/video.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),webm:()=>import("./adapters/video.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),mkv:()=>import("./adapters/video.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  stl:()=>import("./adapters/stl.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),"3mf":()=>import("./adapters/three-mf.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  md:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),txt:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),py:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  js:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),mjs:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),ts:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  tsx:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),jsx:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),json:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  yaml:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),yml:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),c:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  cpp:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),h:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),hpp:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),
  cs:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07"),java:()=>import("./adapters/text.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=abc69b6ea8ff233a967a9264dee3e5ff2d2ebc07");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
