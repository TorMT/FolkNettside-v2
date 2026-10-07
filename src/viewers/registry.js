import {extension} from "./utils.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),docx:()=>import("./adapters/office.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),xlsx:()=>import("./adapters/office.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),pptx:()=>import("./adapters/office.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),csv:()=>import("./adapters/csv.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  html:()=>import("./adapters/html.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),htm:()=>import("./adapters/html.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  ipynb:()=>import("./adapters/notebook.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),tex:()=>import("./adapters/latex.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  mp4:()=>import("./adapters/video.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),webm:()=>import("./adapters/video.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),mkv:()=>import("./adapters/video.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  stl:()=>import("./adapters/stl.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),"3mf":()=>import("./adapters/three-mf.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  md:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),txt:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),py:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  js:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),mjs:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),ts:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  tsx:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),jsx:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),json:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  yaml:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),yml:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),c:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  cpp:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),h:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),hpp:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),
  cs:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10"),java:()=>import("./adapters/text.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=ad1fad991cf1a403893eab9eee1791e5d4420a10");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
