import {extension} from "./utils.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),docx:()=>import("./adapters/office.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),xlsx:()=>import("./adapters/office.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),pptx:()=>import("./adapters/office.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),csv:()=>import("./adapters/csv.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  html:()=>import("./adapters/html.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),htm:()=>import("./adapters/html.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  ipynb:()=>import("./adapters/notebook.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),tex:()=>import("./adapters/latex.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  mp4:()=>import("./adapters/video.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),webm:()=>import("./adapters/video.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),mkv:()=>import("./adapters/video.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  stl:()=>import("./adapters/stl.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),"3mf":()=>import("./adapters/three-mf.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  md:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),txt:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),py:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  js:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),mjs:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),ts:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  tsx:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),jsx:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),json:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  yaml:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),yml:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),c:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  cpp:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),h:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),hpp:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),
  cs:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b"),java:()=>import("./adapters/text.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=8888971e4f6994728439c5fe3d1fdaa28a4e4e1b");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
