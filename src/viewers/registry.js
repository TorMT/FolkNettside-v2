import {extension} from "./utils.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),docx:()=>import("./adapters/office.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),xlsx:()=>import("./adapters/office.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),pptx:()=>import("./adapters/office.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),csv:()=>import("./adapters/csv.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  html:()=>import("./adapters/html.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),htm:()=>import("./adapters/html.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  ipynb:()=>import("./adapters/notebook.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),tex:()=>import("./adapters/latex.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  mp4:()=>import("./adapters/video.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),webm:()=>import("./adapters/video.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),mkv:()=>import("./adapters/video.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  stl:()=>import("./adapters/stl.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),"3mf":()=>import("./adapters/three-mf.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  md:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),txt:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),py:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  js:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),mjs:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),ts:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  tsx:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),jsx:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),json:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  yaml:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),yml:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),c:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  cpp:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),h:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),hpp:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),
  cs:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00"),java:()=>import("./adapters/text.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=456370d97d6fc90af984e942db5e7683ef5c8d00");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
