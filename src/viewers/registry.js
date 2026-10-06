import {extension} from "./utils.js?v=1093b9e37081cef71bae129b78834bb0ea84232a";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),docx:()=>import("./adapters/office.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),xlsx:()=>import("./adapters/office.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),pptx:()=>import("./adapters/office.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),csv:()=>import("./adapters/csv.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  html:()=>import("./adapters/html.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),htm:()=>import("./adapters/html.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  ipynb:()=>import("./adapters/notebook.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),tex:()=>import("./adapters/latex.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  mp4:()=>import("./adapters/video.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),webm:()=>import("./adapters/video.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),mkv:()=>import("./adapters/video.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  stl:()=>import("./adapters/stl.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),"3mf":()=>import("./adapters/three-mf.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  md:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),txt:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),py:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  js:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),mjs:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),ts:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  tsx:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),jsx:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),json:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  yaml:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),yml:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),c:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  cpp:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),h:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),hpp:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),
  cs:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a"),java:()=>import("./adapters/text.js?v=1093b9e37081cef71bae129b78834bb0ea84232a")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=1093b9e37081cef71bae129b78834bb0ea84232a");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
