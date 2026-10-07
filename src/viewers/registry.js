import {extension} from "./utils.js?v=973646479ea14319b0ab8e3aafaf6e476432af73";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),docx:()=>import("./adapters/office.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),xlsx:()=>import("./adapters/office.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),pptx:()=>import("./adapters/office.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),csv:()=>import("./adapters/csv.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  html:()=>import("./adapters/html.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),htm:()=>import("./adapters/html.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  ipynb:()=>import("./adapters/notebook.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),tex:()=>import("./adapters/latex.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  mp4:()=>import("./adapters/video.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),webm:()=>import("./adapters/video.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),mkv:()=>import("./adapters/video.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  stl:()=>import("./adapters/stl.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),"3mf":()=>import("./adapters/three-mf.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  md:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),txt:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),py:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  js:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),mjs:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),ts:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  tsx:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),jsx:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),json:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  yaml:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),yml:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),c:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  cpp:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),h:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),hpp:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),
  cs:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73"),java:()=>import("./adapters/text.js?v=973646479ea14319b0ab8e3aafaf6e476432af73")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=973646479ea14319b0ab8e3aafaf6e476432af73");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=973646479ea14319b0ab8e3aafaf6e476432af73");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
