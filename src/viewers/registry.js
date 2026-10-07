import {extension} from "./utils.js?v=16b56f584df4a49cc3339da01884f6355feee37d";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),docx:()=>import("./adapters/office.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),xlsx:()=>import("./adapters/office.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),pptx:()=>import("./adapters/office.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),csv:()=>import("./adapters/csv.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  html:()=>import("./adapters/html.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),htm:()=>import("./adapters/html.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  ipynb:()=>import("./adapters/notebook.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),tex:()=>import("./adapters/latex.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  mp4:()=>import("./adapters/video.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),webm:()=>import("./adapters/video.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),mkv:()=>import("./adapters/video.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  stl:()=>import("./adapters/stl.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),"3mf":()=>import("./adapters/three-mf.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  md:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),txt:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),py:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  js:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),mjs:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),ts:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  tsx:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),jsx:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),json:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  yaml:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),yml:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),c:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  cpp:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),h:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),hpp:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),
  cs:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d"),java:()=>import("./adapters/text.js?v=16b56f584df4a49cc3339da01884f6355feee37d")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=16b56f584df4a49cc3339da01884f6355feee37d");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=16b56f584df4a49cc3339da01884f6355feee37d");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
