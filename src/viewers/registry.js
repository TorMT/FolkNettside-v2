import {extension} from "./utils.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),docx:()=>import("./adapters/office.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),xlsx:()=>import("./adapters/office.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),pptx:()=>import("./adapters/office.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),csv:()=>import("./adapters/csv.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  html:()=>import("./adapters/html.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),htm:()=>import("./adapters/html.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  ipynb:()=>import("./adapters/notebook.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),tex:()=>import("./adapters/latex.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  mp4:()=>import("./adapters/video.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),webm:()=>import("./adapters/video.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),mkv:()=>import("./adapters/video.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  stl:()=>import("./adapters/stl.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),"3mf":()=>import("./adapters/three-mf.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  md:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),txt:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),py:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  js:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),mjs:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),ts:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  tsx:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),jsx:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),json:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  yaml:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),yml:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),c:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  cpp:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),h:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),hpp:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),
  cs:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2"),java:()=>import("./adapters/text.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=c03c70dcb49fcc45d104ab6ee046acb51c1b0fd2");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
