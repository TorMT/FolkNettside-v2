import {extension} from "./utils.js?v=d315816c859e0718c106f69ade1724785806956e";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=d315816c859e0718c106f69ade1724785806956e"),docx:()=>import("./adapters/office.js?v=d315816c859e0718c106f69ade1724785806956e"),xlsx:()=>import("./adapters/office.js?v=d315816c859e0718c106f69ade1724785806956e"),pptx:()=>import("./adapters/office.js?v=d315816c859e0718c106f69ade1724785806956e"),csv:()=>import("./adapters/csv.js?v=d315816c859e0718c106f69ade1724785806956e"),
  html:()=>import("./adapters/html.js?v=d315816c859e0718c106f69ade1724785806956e"),htm:()=>import("./adapters/html.js?v=d315816c859e0718c106f69ade1724785806956e"),
  ipynb:()=>import("./adapters/notebook.js?v=d315816c859e0718c106f69ade1724785806956e"),tex:()=>import("./adapters/latex.js?v=d315816c859e0718c106f69ade1724785806956e"),
  mp4:()=>import("./adapters/video.js?v=d315816c859e0718c106f69ade1724785806956e"),webm:()=>import("./adapters/video.js?v=d315816c859e0718c106f69ade1724785806956e"),mkv:()=>import("./adapters/video.js?v=d315816c859e0718c106f69ade1724785806956e"),
  stl:()=>import("./adapters/stl.js?v=d315816c859e0718c106f69ade1724785806956e"),"3mf":()=>import("./adapters/three-mf.js?v=d315816c859e0718c106f69ade1724785806956e"),
  md:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),txt:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),py:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),
  js:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),mjs:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),ts:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),
  tsx:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),jsx:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),json:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),
  yaml:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),yml:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),c:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),
  cpp:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),h:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),hpp:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),
  cs:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e"),java:()=>import("./adapters/text.js?v=d315816c859e0718c106f69ade1724785806956e")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=d315816c859e0718c106f69ade1724785806956e");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=d315816c859e0718c106f69ade1724785806956e");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
