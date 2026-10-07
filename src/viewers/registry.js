import {extension} from "./utils.js?v=4919690a518f8ded39c5116aac403a61323a3929";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=4919690a518f8ded39c5116aac403a61323a3929"),docx:()=>import("./adapters/office.js?v=4919690a518f8ded39c5116aac403a61323a3929"),xlsx:()=>import("./adapters/office.js?v=4919690a518f8ded39c5116aac403a61323a3929"),pptx:()=>import("./adapters/office.js?v=4919690a518f8ded39c5116aac403a61323a3929"),csv:()=>import("./adapters/csv.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  html:()=>import("./adapters/html.js?v=4919690a518f8ded39c5116aac403a61323a3929"),htm:()=>import("./adapters/html.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  ipynb:()=>import("./adapters/notebook.js?v=4919690a518f8ded39c5116aac403a61323a3929"),tex:()=>import("./adapters/latex.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  mp4:()=>import("./adapters/video.js?v=4919690a518f8ded39c5116aac403a61323a3929"),webm:()=>import("./adapters/video.js?v=4919690a518f8ded39c5116aac403a61323a3929"),mkv:()=>import("./adapters/video.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  stl:()=>import("./adapters/stl.js?v=4919690a518f8ded39c5116aac403a61323a3929"),"3mf":()=>import("./adapters/three-mf.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  md:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),txt:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),py:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  js:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),mjs:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),ts:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  tsx:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),jsx:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),json:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  yaml:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),yml:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),c:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  cpp:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),h:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),hpp:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),
  cs:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929"),java:()=>import("./adapters/text.js?v=4919690a518f8ded39c5116aac403a61323a3929")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=4919690a518f8ded39c5116aac403a61323a3929");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=4919690a518f8ded39c5116aac403a61323a3929");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
