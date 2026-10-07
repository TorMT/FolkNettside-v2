import {extension} from "./utils.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),docx:()=>import("./adapters/office.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),xlsx:()=>import("./adapters/office.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),pptx:()=>import("./adapters/office.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),csv:()=>import("./adapters/csv.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  html:()=>import("./adapters/html.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),htm:()=>import("./adapters/html.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  ipynb:()=>import("./adapters/notebook.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),tex:()=>import("./adapters/latex.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  mp4:()=>import("./adapters/video.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),webm:()=>import("./adapters/video.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),mkv:()=>import("./adapters/video.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  stl:()=>import("./adapters/stl.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),"3mf":()=>import("./adapters/three-mf.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  md:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),txt:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),py:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  js:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),mjs:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),ts:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  tsx:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),jsx:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),json:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  yaml:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),yml:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),c:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  cpp:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),h:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),hpp:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),
  cs:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2"),java:()=>import("./adapters/text.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=2c771b97652bfa8a1e9060d01f8270058368c1b2");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
