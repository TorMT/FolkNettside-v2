import {extension} from "./utils.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),docx:()=>import("./adapters/office.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),xlsx:()=>import("./adapters/office.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),pptx:()=>import("./adapters/office.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),csv:()=>import("./adapters/csv.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  html:()=>import("./adapters/html.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),htm:()=>import("./adapters/html.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  ipynb:()=>import("./adapters/notebook.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),tex:()=>import("./adapters/latex.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  mp4:()=>import("./adapters/video.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),webm:()=>import("./adapters/video.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),mkv:()=>import("./adapters/video.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  stl:()=>import("./adapters/stl.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),"3mf":()=>import("./adapters/three-mf.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  md:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),txt:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),py:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  js:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),mjs:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),ts:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  tsx:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),jsx:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),json:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  yaml:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),yml:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),c:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  cpp:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),h:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),hpp:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),
  cs:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd"),java:()=>import("./adapters/text.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b8f1793038fe30309a1e47a97e1cb425829879fd");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
