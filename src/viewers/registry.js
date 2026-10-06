import {extension} from "./utils.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),docx:()=>import("./adapters/office.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),xlsx:()=>import("./adapters/office.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),pptx:()=>import("./adapters/office.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),csv:()=>import("./adapters/csv.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  html:()=>import("./adapters/html.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),htm:()=>import("./adapters/html.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  ipynb:()=>import("./adapters/notebook.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),tex:()=>import("./adapters/latex.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  mp4:()=>import("./adapters/video.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),webm:()=>import("./adapters/video.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),mkv:()=>import("./adapters/video.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  stl:()=>import("./adapters/stl.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),"3mf":()=>import("./adapters/three-mf.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  md:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),txt:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),py:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  js:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),mjs:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),ts:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  tsx:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),jsx:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),json:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  yaml:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),yml:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),c:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  cpp:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),h:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),hpp:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),
  cs:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd"),java:()=>import("./adapters/text.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=042595eaf995d6fb7a6021d1da92e6201149a0cd");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
