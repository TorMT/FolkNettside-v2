import {extension} from "./utils.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),docx:()=>import("./adapters/office.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),xlsx:()=>import("./adapters/office.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),pptx:()=>import("./adapters/office.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),csv:()=>import("./adapters/csv.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  html:()=>import("./adapters/html.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),htm:()=>import("./adapters/html.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  ipynb:()=>import("./adapters/notebook.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),tex:()=>import("./adapters/latex.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  mp4:()=>import("./adapters/video.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),webm:()=>import("./adapters/video.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),mkv:()=>import("./adapters/video.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  stl:()=>import("./adapters/stl.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),"3mf":()=>import("./adapters/three-mf.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  md:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),txt:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),py:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  js:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),mjs:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),ts:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  tsx:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),jsx:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),json:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  yaml:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),yml:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),c:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  cpp:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),h:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),hpp:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),
  cs:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2"),java:()=>import("./adapters/text.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=6d99993b799267c1b2e599e7d7e0d59f4c24d7a2");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
