import {extension} from "./utils.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),docx:()=>import("./adapters/office.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),xlsx:()=>import("./adapters/office.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),pptx:()=>import("./adapters/office.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),csv:()=>import("./adapters/csv.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  html:()=>import("./adapters/html.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),htm:()=>import("./adapters/html.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  ipynb:()=>import("./adapters/notebook.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),tex:()=>import("./adapters/latex.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  mp4:()=>import("./adapters/video.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),webm:()=>import("./adapters/video.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),mkv:()=>import("./adapters/video.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  stl:()=>import("./adapters/stl.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),"3mf":()=>import("./adapters/three-mf.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  md:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),txt:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),py:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  js:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),mjs:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),ts:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  tsx:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),jsx:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),json:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  yaml:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),yml:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),c:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  cpp:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),h:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),hpp:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),
  cs:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9"),java:()=>import("./adapters/text.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=fbba8f74c8f04f8b78381cb3dc4b30bc59589ee9");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
