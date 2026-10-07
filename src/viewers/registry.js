import {extension} from "./utils.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),docx:()=>import("./adapters/office.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),xlsx:()=>import("./adapters/office.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),pptx:()=>import("./adapters/office.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),csv:()=>import("./adapters/csv.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  html:()=>import("./adapters/html.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),htm:()=>import("./adapters/html.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  ipynb:()=>import("./adapters/notebook.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),tex:()=>import("./adapters/latex.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  mp4:()=>import("./adapters/video.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),webm:()=>import("./adapters/video.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),mkv:()=>import("./adapters/video.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  stl:()=>import("./adapters/stl.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),"3mf":()=>import("./adapters/three-mf.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  md:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),txt:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),py:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  js:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),mjs:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),ts:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  tsx:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),jsx:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),json:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  yaml:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),yml:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),c:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  cpp:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),h:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),hpp:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),
  cs:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed"),java:()=>import("./adapters/text.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=32025ca3b1372ca3f6bad398d0e71b1103eab0ed");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
