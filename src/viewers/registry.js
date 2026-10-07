import {extension} from "./utils.js?v=66a32719412b4629bb066b94a400a1693fa008ca";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),docx:()=>import("./adapters/office.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),xlsx:()=>import("./adapters/office.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),pptx:()=>import("./adapters/office.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),csv:()=>import("./adapters/csv.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  html:()=>import("./adapters/html.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),htm:()=>import("./adapters/html.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  ipynb:()=>import("./adapters/notebook.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),tex:()=>import("./adapters/latex.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  mp4:()=>import("./adapters/video.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),webm:()=>import("./adapters/video.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),mkv:()=>import("./adapters/video.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  stl:()=>import("./adapters/stl.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),"3mf":()=>import("./adapters/three-mf.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  md:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),txt:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),py:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  js:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),mjs:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),ts:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  tsx:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),jsx:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),json:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  yaml:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),yml:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),c:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  cpp:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),h:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),hpp:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),
  cs:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca"),java:()=>import("./adapters/text.js?v=66a32719412b4629bb066b94a400a1693fa008ca")
};
export async function loadAdapter(resource){
  if(resource.kind==="YOUTUBE"){
    const module=await import("./adapters/youtube.js?v=66a32719412b4629bb066b94a400a1693fa008ca");
    return {extension:"youtube",render:module.render};
  }
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=66a32719412b4629bb066b94a400a1693fa008ca");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
