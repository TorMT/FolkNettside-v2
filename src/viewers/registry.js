import {extension} from "./utils.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),docx:()=>import("./adapters/office.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),xlsx:()=>import("./adapters/office.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),pptx:()=>import("./adapters/office.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),csv:()=>import("./adapters/csv.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  html:()=>import("./adapters/html.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),htm:()=>import("./adapters/html.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  ipynb:()=>import("./adapters/notebook.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),tex:()=>import("./adapters/latex.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  mp4:()=>import("./adapters/video.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),webm:()=>import("./adapters/video.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),mkv:()=>import("./adapters/video.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  stl:()=>import("./adapters/stl.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),"3mf":()=>import("./adapters/three-mf.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  md:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),txt:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),py:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  js:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),mjs:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),ts:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  tsx:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),jsx:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),json:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  yaml:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),yml:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),c:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  cpp:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),h:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),hpp:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),
  cs:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375"),java:()=>import("./adapters/text.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=04b35147e65e3b44da99ddf4a7d4525d7c57c375");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
