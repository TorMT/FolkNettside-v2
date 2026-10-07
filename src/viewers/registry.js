import {extension} from "./utils.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),docx:()=>import("./adapters/office.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),xlsx:()=>import("./adapters/office.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),pptx:()=>import("./adapters/office.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),csv:()=>import("./adapters/csv.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  html:()=>import("./adapters/html.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),htm:()=>import("./adapters/html.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  ipynb:()=>import("./adapters/notebook.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),tex:()=>import("./adapters/latex.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  mp4:()=>import("./adapters/video.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),webm:()=>import("./adapters/video.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),mkv:()=>import("./adapters/video.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  stl:()=>import("./adapters/stl.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),"3mf":()=>import("./adapters/three-mf.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  md:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),txt:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),py:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  js:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),mjs:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),ts:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  tsx:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),jsx:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),json:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  yaml:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),yml:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),c:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  cpp:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),h:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),hpp:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),
  cs:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc"),java:()=>import("./adapters/text.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=8d61c2af3a8dbac37f74daddfdef722be809fbcc");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
