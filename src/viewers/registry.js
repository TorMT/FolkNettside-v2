import {extension} from "./utils.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34";
const adapterLoaders={
  pdf:()=>import("./adapters/pdf.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),docx:()=>import("./adapters/office.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),xlsx:()=>import("./adapters/office.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),pptx:()=>import("./adapters/office.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),csv:()=>import("./adapters/csv.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  html:()=>import("./adapters/html.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),htm:()=>import("./adapters/html.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  ipynb:()=>import("./adapters/notebook.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),tex:()=>import("./adapters/latex.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  mp4:()=>import("./adapters/video.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),webm:()=>import("./adapters/video.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),mkv:()=>import("./adapters/video.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  stl:()=>import("./adapters/stl.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),"3mf":()=>import("./adapters/three-mf.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  md:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),txt:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),py:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  js:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),mjs:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),ts:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  tsx:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),jsx:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),json:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  yaml:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),yml:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),c:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  cpp:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),h:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),hpp:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),
  cs:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34"),java:()=>import("./adapters/text.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34")
};
export async function loadAdapter(resource){
  if(resource.kind==="QUIZ"){
    const module=await import("./adapters/quiz.js?v=b034f1e8cf064957feb7535afd5def017b4ecf34");
    return {extension:"quiz",render:module.render};
  }
  const ext=extension(resource.path),loader=adapterLoaders[ext]||adapterLoaders.txt,module=await loader();
  if(typeof module.render!=="function")throw new Error(`Viewer adapter for .${ext} has no render() export`);
  return {extension:ext,render:module.render};
}
