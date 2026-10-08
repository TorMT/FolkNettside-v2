import {extension} from "./utils.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),docx:()=>import("./adapters/office.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),xlsx:()=>import("./adapters/office.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),pptx:()=>import("./adapters/office.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),csv:()=>import("./adapters/csv.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  html:()=>import("./adapters/html.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),htm:()=>import("./adapters/html.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  ipynb:()=>import("./adapters/notebook.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),tex:()=>import("./adapters/latex.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  mp4:()=>import("./adapters/video.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),webm:()=>import("./adapters/video.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),mkv:()=>import("./adapters/video.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  stl:()=>import("./adapters/stl.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),"3mf":()=>import("./adapters/three-mf.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  md:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),txt:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),py:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  js:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),mjs:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),ts:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  tsx:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),jsx:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),json:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  yaml:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),yml:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),c:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  cpp:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),h:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),hpp:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),
  cs:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02"),java:()=>import("./adapters/text.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=8b9f276e6ed155a802cb58fa1098559ad66b2b02");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
