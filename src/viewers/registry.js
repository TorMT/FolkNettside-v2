import {extension} from "./utils.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),docx:()=>import("./adapters/office.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),xlsx:()=>import("./adapters/office.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),pptx:()=>import("./adapters/office.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),csv:()=>import("./adapters/csv.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  html:()=>import("./adapters/html.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),htm:()=>import("./adapters/html.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  ipynb:()=>import("./adapters/notebook.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),tex:()=>import("./adapters/latex.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  mp4:()=>import("./adapters/video.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),webm:()=>import("./adapters/video.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),mkv:()=>import("./adapters/video.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  stl:()=>import("./adapters/stl.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),"3mf":()=>import("./adapters/three-mf.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  md:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),txt:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),py:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  js:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),mjs:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),ts:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  tsx:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),jsx:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),json:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  yaml:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),yml:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),c:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  cpp:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),h:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),hpp:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),
  cs:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22"),java:()=>import("./adapters/text.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=30774347c923b1a7a56e2dbeb73879d85d87ee22");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
