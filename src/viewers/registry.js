import {extension} from "./utils.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),docx:()=>import("./adapters/office.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),xlsx:()=>import("./adapters/office.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),pptx:()=>import("./adapters/office.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),csv:()=>import("./adapters/csv.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  html:()=>import("./adapters/html.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),htm:()=>import("./adapters/html.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  ipynb:()=>import("./adapters/notebook.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),tex:()=>import("./adapters/latex.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  mp4:()=>import("./adapters/video.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),webm:()=>import("./adapters/video.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),mkv:()=>import("./adapters/video.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  stl:()=>import("./adapters/stl.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),"3mf":()=>import("./adapters/three-mf.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  md:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),txt:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),py:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  js:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),mjs:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),ts:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  tsx:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),jsx:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),json:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  yaml:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),yml:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),c:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  cpp:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),h:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),hpp:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),
  cs:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c"),java:()=>import("./adapters/text.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=f3af112d5890d3a854ead3982ac9dc909dab923c");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
