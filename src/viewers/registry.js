import {extension} from "./utils.js?v=9067ffb63940252c410651966c2672298eb6f55e";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=9067ffb63940252c410651966c2672298eb6f55e"),docx:()=>import("./adapters/office.js?v=9067ffb63940252c410651966c2672298eb6f55e"),xlsx:()=>import("./adapters/office.js?v=9067ffb63940252c410651966c2672298eb6f55e"),pptx:()=>import("./adapters/office.js?v=9067ffb63940252c410651966c2672298eb6f55e"),csv:()=>import("./adapters/csv.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  html:()=>import("./adapters/html.js?v=9067ffb63940252c410651966c2672298eb6f55e"),htm:()=>import("./adapters/html.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  ipynb:()=>import("./adapters/notebook.js?v=9067ffb63940252c410651966c2672298eb6f55e"),tex:()=>import("./adapters/latex.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  mp4:()=>import("./adapters/video.js?v=9067ffb63940252c410651966c2672298eb6f55e"),webm:()=>import("./adapters/video.js?v=9067ffb63940252c410651966c2672298eb6f55e"),mkv:()=>import("./adapters/video.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  stl:()=>import("./adapters/stl.js?v=9067ffb63940252c410651966c2672298eb6f55e"),"3mf":()=>import("./adapters/three-mf.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  md:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),txt:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),py:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  js:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),mjs:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),ts:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  tsx:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),jsx:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),json:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  yaml:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),yml:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),c:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  cpp:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),h:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),hpp:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),
  cs:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e"),java:()=>import("./adapters/text.js?v=9067ffb63940252c410651966c2672298eb6f55e")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=9067ffb63940252c410651966c2672298eb6f55e");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=9067ffb63940252c410651966c2672298eb6f55e");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
