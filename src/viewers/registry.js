import {extension} from "./utils.js?v=749b365e3de3c51d551434c241123cb3eb4adb21";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),docx:()=>import("./adapters/office.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),xlsx:()=>import("./adapters/office.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),pptx:()=>import("./adapters/office.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),csv:()=>import("./adapters/csv.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  html:()=>import("./adapters/html.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),htm:()=>import("./adapters/html.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  ipynb:()=>import("./adapters/notebook.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),tex:()=>import("./adapters/latex.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  mp4:()=>import("./adapters/video.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),webm:()=>import("./adapters/video.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),mkv:()=>import("./adapters/video.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  stl:()=>import("./adapters/stl.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),"3mf":()=>import("./adapters/three-mf.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  md:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),txt:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),py:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  js:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),mjs:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),ts:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  tsx:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),jsx:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),json:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  yaml:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),yml:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),c:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  cpp:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),h:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),hpp:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),
  cs:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21"),java:()=>import("./adapters/text.js?v=749b365e3de3c51d551434c241123cb3eb4adb21")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=749b365e3de3c51d551434c241123cb3eb4adb21");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=749b365e3de3c51d551434c241123cb3eb4adb21");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
