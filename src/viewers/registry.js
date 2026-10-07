import {extension} from "./utils.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),docx:()=>import("./adapters/office.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),xlsx:()=>import("./adapters/office.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),pptx:()=>import("./adapters/office.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),csv:()=>import("./adapters/csv.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  html:()=>import("./adapters/html.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),htm:()=>import("./adapters/html.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  ipynb:()=>import("./adapters/notebook.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),tex:()=>import("./adapters/latex.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  mp4:()=>import("./adapters/video.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),webm:()=>import("./adapters/video.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),mkv:()=>import("./adapters/video.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  stl:()=>import("./adapters/stl.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),"3mf":()=>import("./adapters/three-mf.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  md:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),txt:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),py:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  js:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),mjs:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),ts:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  tsx:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),jsx:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),json:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  yaml:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),yml:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),c:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  cpp:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),h:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),hpp:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),
  cs:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f"),java:()=>import("./adapters/text.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=9ed4d572c4d37790e7a04df384049f99652b8a5f");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
