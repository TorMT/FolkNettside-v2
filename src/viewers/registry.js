import {extension} from "./utils.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),docx:()=>import("./adapters/office.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),xlsx:()=>import("./adapters/office.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),pptx:()=>import("./adapters/office.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),csv:()=>import("./adapters/csv.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),tsv:()=>import("./adapters/csv.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),psv:()=>import("./adapters/csv.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  html:()=>import("./adapters/html.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),htm:()=>import("./adapters/html.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  ipynb:()=>import("./adapters/notebook.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),tex:()=>import("./adapters/latex.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  mp4:()=>import("./adapters/video.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),webm:()=>import("./adapters/video.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),mkv:()=>import("./adapters/video.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  stl:()=>import("./adapters/stl.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),"3mf":()=>import("./adapters/three-mf.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  f3z:()=>import("./adapters/fusion.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),f3d:()=>import("./adapters/fusion.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  md:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),txt:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),py:()=>import("./adapters/python.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  js:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),mjs:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),ts:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  tsx:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),jsx:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),json:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  yaml:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),yml:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),c:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  cpp:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),h:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),hpp:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),
  cs:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3"),java:()=>import("./adapters/text.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=6d13dcb3027a80c38112f7315a9916cc1c23d1d3");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
