import {extension} from "./utils.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),docx:()=>import("./adapters/office.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),xlsx:()=>import("./adapters/office.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),pptx:()=>import("./adapters/office.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),csv:()=>import("./adapters/csv.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  html:()=>import("./adapters/html.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),htm:()=>import("./adapters/html.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  ipynb:()=>import("./adapters/notebook.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),tex:()=>import("./adapters/latex.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  mp4:()=>import("./adapters/video.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),webm:()=>import("./adapters/video.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),mkv:()=>import("./adapters/video.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  stl:()=>import("./adapters/stl.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),"3mf":()=>import("./adapters/three-mf.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  md:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),txt:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),py:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  js:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),mjs:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),ts:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  tsx:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),jsx:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),json:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  yaml:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),yml:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),c:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  cpp:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),h:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),hpp:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),
  cs:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347"),java:()=>import("./adapters/text.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=59d30a3c7ff4119cb4e624b6b3b6d2b10d34a347");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
