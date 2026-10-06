import {extension} from "./utils.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),docx:()=>import("./adapters/office.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),xlsx:()=>import("./adapters/office.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),pptx:()=>import("./adapters/office.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),csv:()=>import("./adapters/csv.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  html:()=>import("./adapters/html.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),htm:()=>import("./adapters/html.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  ipynb:()=>import("./adapters/notebook.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),tex:()=>import("./adapters/latex.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  mp4:()=>import("./adapters/video.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),webm:()=>import("./adapters/video.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),mkv:()=>import("./adapters/video.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  stl:()=>import("./adapters/stl.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),"3mf":()=>import("./adapters/three-mf.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  md:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),txt:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),py:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  js:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),mjs:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),ts:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  tsx:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),jsx:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),json:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  yaml:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),yml:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),c:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  cpp:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),h:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),hpp:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),
  cs:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3"),java:()=>import("./adapters/text.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=f535ec1348b3523ace15d945e2114bc1e6c42fb3");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
