import {extension} from "./utils.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),docx:()=>import("./adapters/office.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),xlsx:()=>import("./adapters/office.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),pptx:()=>import("./adapters/office.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),csv:()=>import("./adapters/csv.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  html:()=>import("./adapters/html.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),htm:()=>import("./adapters/html.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  ipynb:()=>import("./adapters/notebook.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),tex:()=>import("./adapters/latex.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  mp4:()=>import("./adapters/video.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),webm:()=>import("./adapters/video.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),mkv:()=>import("./adapters/video.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  stl:()=>import("./adapters/stl.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),"3mf":()=>import("./adapters/three-mf.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  md:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),txt:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),py:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  js:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),mjs:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),ts:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  tsx:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),jsx:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),json:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  yaml:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),yml:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),c:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  cpp:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),h:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),hpp:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),
  cs:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b"),java:()=>import("./adapters/text.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=7fd0b6051ba8d09371ee3c9ce6dd8d2247513c8b");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
