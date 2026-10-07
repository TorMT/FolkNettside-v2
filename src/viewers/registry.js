import {extension} from "./utils.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),docx:()=>import("./adapters/office.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),xlsx:()=>import("./adapters/office.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),pptx:()=>import("./adapters/office.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),csv:()=>import("./adapters/csv.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  html:()=>import("./adapters/html.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),htm:()=>import("./adapters/html.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  ipynb:()=>import("./adapters/notebook.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),tex:()=>import("./adapters/latex.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  mp4:()=>import("./adapters/video.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),webm:()=>import("./adapters/video.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),mkv:()=>import("./adapters/video.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  stl:()=>import("./adapters/stl.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),"3mf":()=>import("./adapters/three-mf.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  md:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),txt:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),py:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  js:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),mjs:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),ts:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  tsx:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),jsx:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),json:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  yaml:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),yml:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),c:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  cpp:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),h:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),hpp:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),
  cs:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243"),java:()=>import("./adapters/text.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=f20c20bc8dedb40274fc109d1075de05adf7c243");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
