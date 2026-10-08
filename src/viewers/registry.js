import {extension} from "./utils.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),docx:()=>import("./adapters/office.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),xlsx:()=>import("./adapters/office.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),pptx:()=>import("./adapters/office.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),csv:()=>import("./adapters/csv.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  html:()=>import("./adapters/html.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),htm:()=>import("./adapters/html.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  ipynb:()=>import("./adapters/notebook.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),tex:()=>import("./adapters/latex.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  mp4:()=>import("./adapters/video.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),webm:()=>import("./adapters/video.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),mkv:()=>import("./adapters/video.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  stl:()=>import("./adapters/stl.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),"3mf":()=>import("./adapters/three-mf.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  md:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),txt:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),py:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  js:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),mjs:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),ts:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  tsx:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),jsx:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),json:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  yaml:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),yml:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),c:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  cpp:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),h:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),hpp:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),
  cs:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a"),java:()=>import("./adapters/text.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=5f9ff415aa0bec861a5c1a299b4268e6a8cb0b9a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
