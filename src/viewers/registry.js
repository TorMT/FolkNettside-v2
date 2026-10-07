import {extension} from "./utils.js?v=918f3b59381fa81bce33c922baf17bd845654f1e";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),docx:()=>import("./adapters/office.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),xlsx:()=>import("./adapters/office.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),pptx:()=>import("./adapters/office.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),csv:()=>import("./adapters/csv.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  html:()=>import("./adapters/html.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),htm:()=>import("./adapters/html.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  ipynb:()=>import("./adapters/notebook.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),tex:()=>import("./adapters/latex.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  mp4:()=>import("./adapters/video.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),webm:()=>import("./adapters/video.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),mkv:()=>import("./adapters/video.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  stl:()=>import("./adapters/stl.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),"3mf":()=>import("./adapters/three-mf.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  md:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),txt:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),py:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  js:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),mjs:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),ts:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  tsx:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),jsx:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),json:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  yaml:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),yml:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),c:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  cpp:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),h:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),hpp:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),
  cs:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e"),java:()=>import("./adapters/text.js?v=918f3b59381fa81bce33c922baf17bd845654f1e")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=918f3b59381fa81bce33c922baf17bd845654f1e");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=918f3b59381fa81bce33c922baf17bd845654f1e");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
