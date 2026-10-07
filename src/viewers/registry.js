import {extension} from "./utils.js?v=6e5390c2179306a1067152159265834028535831";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=6e5390c2179306a1067152159265834028535831"),docx:()=>import("./adapters/office.js?v=6e5390c2179306a1067152159265834028535831"),xlsx:()=>import("./adapters/office.js?v=6e5390c2179306a1067152159265834028535831"),pptx:()=>import("./adapters/office.js?v=6e5390c2179306a1067152159265834028535831"),csv:()=>import("./adapters/csv.js?v=6e5390c2179306a1067152159265834028535831"),
  html:()=>import("./adapters/html.js?v=6e5390c2179306a1067152159265834028535831"),htm:()=>import("./adapters/html.js?v=6e5390c2179306a1067152159265834028535831"),
  ipynb:()=>import("./adapters/notebook.js?v=6e5390c2179306a1067152159265834028535831"),tex:()=>import("./adapters/latex.js?v=6e5390c2179306a1067152159265834028535831"),
  mp4:()=>import("./adapters/video.js?v=6e5390c2179306a1067152159265834028535831"),webm:()=>import("./adapters/video.js?v=6e5390c2179306a1067152159265834028535831"),mkv:()=>import("./adapters/video.js?v=6e5390c2179306a1067152159265834028535831"),
  stl:()=>import("./adapters/stl.js?v=6e5390c2179306a1067152159265834028535831"),"3mf":()=>import("./adapters/three-mf.js?v=6e5390c2179306a1067152159265834028535831"),
  md:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),txt:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),py:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),
  js:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),mjs:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),ts:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),
  tsx:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),jsx:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),json:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),
  yaml:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),yml:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),c:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),
  cpp:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),h:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),hpp:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),
  cs:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831"),java:()=>import("./adapters/text.js?v=6e5390c2179306a1067152159265834028535831")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=6e5390c2179306a1067152159265834028535831");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=6e5390c2179306a1067152159265834028535831");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
