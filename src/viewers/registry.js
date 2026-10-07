import {extension} from "./utils.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),docx:()=>import("./adapters/office.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),xlsx:()=>import("./adapters/office.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),pptx:()=>import("./adapters/office.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),csv:()=>import("./adapters/csv.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  html:()=>import("./adapters/html.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),htm:()=>import("./adapters/html.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  ipynb:()=>import("./adapters/notebook.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),tex:()=>import("./adapters/latex.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  mp4:()=>import("./adapters/video.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),webm:()=>import("./adapters/video.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),mkv:()=>import("./adapters/video.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  stl:()=>import("./adapters/stl.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),"3mf":()=>import("./adapters/three-mf.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  md:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),txt:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),py:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  js:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),mjs:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),ts:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  tsx:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),jsx:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),json:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  yaml:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),yml:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),c:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  cpp:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),h:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),hpp:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),
  cs:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c"),java:()=>import("./adapters/text.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=e0a9770fa9862b4adecdd47eccd60a8ab0c5984c");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
