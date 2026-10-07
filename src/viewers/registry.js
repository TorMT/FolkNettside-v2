import {extension} from "./utils.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),docx:()=>import("./adapters/office.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),xlsx:()=>import("./adapters/office.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),pptx:()=>import("./adapters/office.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),csv:()=>import("./adapters/csv.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  html:()=>import("./adapters/html.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),htm:()=>import("./adapters/html.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  ipynb:()=>import("./adapters/notebook.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),tex:()=>import("./adapters/latex.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  mp4:()=>import("./adapters/video.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),webm:()=>import("./adapters/video.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),mkv:()=>import("./adapters/video.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  stl:()=>import("./adapters/stl.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),"3mf":()=>import("./adapters/three-mf.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  md:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),txt:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),py:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  js:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),mjs:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),ts:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  tsx:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),jsx:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),json:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  yaml:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),yml:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),c:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  cpp:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),h:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),hpp:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),
  cs:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4"),java:()=>import("./adapters/text.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b05c486c413758f85c7939d5eb40bc55c4305fe4");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
