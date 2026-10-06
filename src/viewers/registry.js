import {extension} from "./utils.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),docx:()=>import("./adapters/office.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),xlsx:()=>import("./adapters/office.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),pptx:()=>import("./adapters/office.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),csv:()=>import("./adapters/csv.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  html:()=>import("./adapters/html.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),htm:()=>import("./adapters/html.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  ipynb:()=>import("./adapters/notebook.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),tex:()=>import("./adapters/latex.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  mp4:()=>import("./adapters/video.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),webm:()=>import("./adapters/video.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),mkv:()=>import("./adapters/video.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  stl:()=>import("./adapters/stl.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),"3mf":()=>import("./adapters/three-mf.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  md:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),txt:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),py:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  js:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),mjs:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),ts:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  tsx:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),jsx:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),json:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  yaml:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),yml:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),c:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  cpp:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),h:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),hpp:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),
  cs:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82"),java:()=>import("./adapters/text.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=33df360439ba2ff7c5d1dd3324885863e2194f82");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
