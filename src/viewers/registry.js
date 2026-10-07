import {extension} from "./utils.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),docx:()=>import("./adapters/office.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),xlsx:()=>import("./adapters/office.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),pptx:()=>import("./adapters/office.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),csv:()=>import("./adapters/csv.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  html:()=>import("./adapters/html.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),htm:()=>import("./adapters/html.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  ipynb:()=>import("./adapters/notebook.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),tex:()=>import("./adapters/latex.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  mp4:()=>import("./adapters/video.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),webm:()=>import("./adapters/video.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),mkv:()=>import("./adapters/video.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  stl:()=>import("./adapters/stl.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),"3mf":()=>import("./adapters/three-mf.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  md:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),txt:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),py:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  js:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),mjs:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),ts:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  tsx:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),jsx:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),json:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  yaml:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),yml:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),c:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  cpp:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),h:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),hpp:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),
  cs:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98"),java:()=>import("./adapters/text.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=31c7594ef49b8ed5d3821cebc6fe48b18a791e98");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
