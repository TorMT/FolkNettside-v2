import {extension} from "./utils.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),docx:()=>import("./adapters/office.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),xlsx:()=>import("./adapters/office.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),pptx:()=>import("./adapters/office.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),csv:()=>import("./adapters/csv.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  html:()=>import("./adapters/html.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),htm:()=>import("./adapters/html.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  ipynb:()=>import("./adapters/notebook.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),tex:()=>import("./adapters/latex.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  mp4:()=>import("./adapters/video.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),webm:()=>import("./adapters/video.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),mkv:()=>import("./adapters/video.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  stl:()=>import("./adapters/stl.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),"3mf":()=>import("./adapters/three-mf.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  md:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),txt:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),py:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  js:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),mjs:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),ts:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  tsx:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),jsx:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),json:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  yaml:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),yml:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),c:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  cpp:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),h:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),hpp:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),
  cs:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97"),java:()=>import("./adapters/text.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=2daeaf56cf8685ab0a64f2af5f12d1ddcc032e97");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
