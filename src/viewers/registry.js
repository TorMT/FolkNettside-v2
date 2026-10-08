import {extension} from "./utils.js?v=427aa369cee6fcff6f75d61afa97012b64189770";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),docx:()=>import("./adapters/office.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),xlsx:()=>import("./adapters/office.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),pptx:()=>import("./adapters/office.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),csv:()=>import("./adapters/csv.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  html:()=>import("./adapters/html.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),htm:()=>import("./adapters/html.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  ipynb:()=>import("./adapters/notebook.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),tex:()=>import("./adapters/latex.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  mp4:()=>import("./adapters/video.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),webm:()=>import("./adapters/video.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),mkv:()=>import("./adapters/video.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  stl:()=>import("./adapters/stl.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),"3mf":()=>import("./adapters/three-mf.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  md:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),txt:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),py:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  js:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),mjs:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),ts:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  tsx:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),jsx:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),json:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  yaml:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),yml:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),c:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  cpp:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),h:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),hpp:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),
  cs:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770"),java:()=>import("./adapters/text.js?v=427aa369cee6fcff6f75d61afa97012b64189770")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=427aa369cee6fcff6f75d61afa97012b64189770");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=427aa369cee6fcff6f75d61afa97012b64189770");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
