import {extension} from "./utils.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),docx:()=>import("./adapters/office.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),xlsx:()=>import("./adapters/office.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),pptx:()=>import("./adapters/office.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),csv:()=>import("./adapters/csv.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  html:()=>import("./adapters/html.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),htm:()=>import("./adapters/html.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  ipynb:()=>import("./adapters/notebook.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),tex:()=>import("./adapters/latex.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  mp4:()=>import("./adapters/video.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),webm:()=>import("./adapters/video.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),mkv:()=>import("./adapters/video.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  stl:()=>import("./adapters/stl.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),"3mf":()=>import("./adapters/three-mf.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  md:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),txt:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),py:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  js:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),mjs:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),ts:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  tsx:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),jsx:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),json:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  yaml:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),yml:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),c:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  cpp:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),h:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),hpp:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),
  cs:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090"),java:()=>import("./adapters/text.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=94d12bc5f13f9102e6d9b0b90ae4c5e46dabc090");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
