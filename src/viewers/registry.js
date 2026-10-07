import {extension} from "./utils.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),docx:()=>import("./adapters/office.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),xlsx:()=>import("./adapters/office.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),pptx:()=>import("./adapters/office.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),csv:()=>import("./adapters/csv.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  html:()=>import("./adapters/html.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),htm:()=>import("./adapters/html.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  ipynb:()=>import("./adapters/notebook.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),tex:()=>import("./adapters/latex.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  mp4:()=>import("./adapters/video.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),webm:()=>import("./adapters/video.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),mkv:()=>import("./adapters/video.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  stl:()=>import("./adapters/stl.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),"3mf":()=>import("./adapters/three-mf.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  md:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),txt:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),py:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  js:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),mjs:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),ts:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  tsx:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),jsx:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),json:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  yaml:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),yml:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),c:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  cpp:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),h:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),hpp:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),
  cs:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876"),java:()=>import("./adapters/text.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=7ea08d0085c534c25fb0281f80c7c3108001d876");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
