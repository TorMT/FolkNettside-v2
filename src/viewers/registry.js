import {extension} from "./utils.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),docx:()=>import("./adapters/office.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),xlsx:()=>import("./adapters/office.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),pptx:()=>import("./adapters/office.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),csv:()=>import("./adapters/csv.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  html:()=>import("./adapters/html.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),htm:()=>import("./adapters/html.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  ipynb:()=>import("./adapters/notebook.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),tex:()=>import("./adapters/latex.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  mp4:()=>import("./adapters/video.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),webm:()=>import("./adapters/video.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),mkv:()=>import("./adapters/video.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  stl:()=>import("./adapters/stl.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),"3mf":()=>import("./adapters/three-mf.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  md:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),txt:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),py:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  js:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),mjs:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),ts:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  tsx:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),jsx:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),json:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  yaml:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),yml:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),c:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  cpp:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),h:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),hpp:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),
  cs:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a"),java:()=>import("./adapters/text.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=85f7c490bbea07c20086f2a5ed32d3cc4d8c752a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
