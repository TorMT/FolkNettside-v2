import {extension} from "./utils.js?v=56d66ac9335184d5d896f157469fcd814625e9bd";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),docx:()=>import("./adapters/office.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),xlsx:()=>import("./adapters/office.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),pptx:()=>import("./adapters/office.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),csv:()=>import("./adapters/csv.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  html:()=>import("./adapters/html.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),htm:()=>import("./adapters/html.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  ipynb:()=>import("./adapters/notebook.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),tex:()=>import("./adapters/latex.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  mp4:()=>import("./adapters/video.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),webm:()=>import("./adapters/video.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),mkv:()=>import("./adapters/video.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  stl:()=>import("./adapters/stl.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),"3mf":()=>import("./adapters/three-mf.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  md:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),txt:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),py:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  js:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),mjs:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),ts:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  tsx:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),jsx:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),json:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  yaml:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),yml:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),c:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  cpp:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),h:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),hpp:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),
  cs:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd"),java:()=>import("./adapters/text.js?v=56d66ac9335184d5d896f157469fcd814625e9bd")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=56d66ac9335184d5d896f157469fcd814625e9bd");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=56d66ac9335184d5d896f157469fcd814625e9bd");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
