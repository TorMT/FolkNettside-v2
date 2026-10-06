import {extension} from "./utils.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),docx:()=>import("./adapters/office.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),xlsx:()=>import("./adapters/office.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),pptx:()=>import("./adapters/office.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),csv:()=>import("./adapters/csv.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  html:()=>import("./adapters/html.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),htm:()=>import("./adapters/html.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  ipynb:()=>import("./adapters/notebook.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),tex:()=>import("./adapters/latex.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  mp4:()=>import("./adapters/video.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),webm:()=>import("./adapters/video.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),mkv:()=>import("./adapters/video.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  stl:()=>import("./adapters/stl.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),"3mf":()=>import("./adapters/three-mf.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  md:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),txt:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),py:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  js:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),mjs:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),ts:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  tsx:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),jsx:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),json:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  yaml:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),yml:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),c:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  cpp:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),h:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),hpp:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),
  cs:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7"),java:()=>import("./adapters/text.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=163ef63e81a0eff464bd137031a1aded2d533ea7");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
