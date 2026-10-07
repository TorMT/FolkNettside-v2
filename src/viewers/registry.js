import {extension} from "./utils.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),docx:()=>import("./adapters/office.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),xlsx:()=>import("./adapters/office.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),pptx:()=>import("./adapters/office.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),csv:()=>import("./adapters/csv.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  html:()=>import("./adapters/html.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),htm:()=>import("./adapters/html.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  ipynb:()=>import("./adapters/notebook.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),tex:()=>import("./adapters/latex.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  mp4:()=>import("./adapters/video.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),webm:()=>import("./adapters/video.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),mkv:()=>import("./adapters/video.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  stl:()=>import("./adapters/stl.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),"3mf":()=>import("./adapters/three-mf.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  md:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),txt:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),py:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  js:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),mjs:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),ts:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  tsx:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),jsx:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),json:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  yaml:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),yml:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),c:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  cpp:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),h:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),hpp:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),
  cs:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995"),java:()=>import("./adapters/text.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=f2e7c561c51e1459d9c84b3a715d229a7ec59995");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
